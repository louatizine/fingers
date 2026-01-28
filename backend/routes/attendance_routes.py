from flask import Blueprint, request, jsonify, Response
from database import get_db
from models.attendance_model import AttendanceModel
from datetime import datetime, timedelta
from bson import ObjectId
from services.attendance_service import (
    calculate_worked_hours,
    get_attendance_settings,
    get_daily_summary_with_hours
)
import logging
import csv
from io import StringIO

attendance_bp = Blueprint('attendance', __name__)
logger = logging.getLogger(__name__)

@attendance_bp.route('/manual', methods=['POST'])
def create_manual_attendance():
    """
    Record manual attendance event (check-in or check-out) for testing
    Same as regular attendance, but explicitly named for manual entry
    """
    try:
        db = get_db()
        data = request.get_json()
        
        # Validate request
        is_valid, error = AttendanceModel.validate_attendance(data)
        if not is_valid:
            return jsonify({'success': False, 'error': error}), 400
        
        # Verify user exists
        user = db.users.find_one({'employee_id': data['employee_id']})
        if not user:
            return jsonify({
                'success': False,
                'error': f"User {data['employee_id']} not found"
            }), 404
        
        # Parse timestamp if provided
        timestamp = None
        if 'timestamp' in data:
            timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
        
        # Create attendance log with optional timestamp
        attendance_log = AttendanceModel.create_attendance_log(
            employee_id=data['employee_id'],
            event_type=data['event_type'],
            device_id=data.get('device_id', 'MANUAL'),
            match_score=data.get('match_score', 100),
            notes=data.get('notes', 'Manual entry'),
            timestamp=timestamp  # Pass timestamp to model
        )
        
        # Insert into database
        result = db.attendance.insert_one(attendance_log)
        
        if result.inserted_id:
            logger.info(f"Manual attendance recorded: {data['employee_id']} - {data['event_type']}")
            return jsonify({
                'success': True,
                'message': 'Attendance recorded successfully',
                'data': {
                    'id': str(result.inserted_id),
                    'employee_id': data['employee_id'],
                    'event_type': data['event_type'],
                    'timestamp': attendance_log['timestamp'].isoformat()
                }
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to record attendance'
            }), 500
            
    except Exception as e:
        logger.error(f"Error recording manual attendance: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@attendance_bp.route('', methods=['POST'])
def create_attendance():
    """
    Record attendance event (check-in or check-out)
    Desktop app sends this after fingerprint verification
    """
    try:
        db = get_db()
        data = request.get_json()
        
        # Validate request
        is_valid, error = AttendanceModel.validate_attendance(data)
        if not is_valid:
            return jsonify({'success': False, 'error': error}), 400
        
        # Verify user exists
        user = db.users.find_one({'employee_id': data['employee_id']})
        if not user:
            return jsonify({
                'success': False,
                'error': f"User {data['employee_id']} not found"
            }), 404
        
        # Parse timestamp if provided
        timestamp = None
        if 'timestamp' in data:
            timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
        
        # Create attendance log with optional timestamp
        attendance_log = AttendanceModel.create_attendance_log(
            employee_id=data['employee_id'],
            event_type=data['event_type'],
            device_id=data['device_id'],
            match_score=data.get('match_score', 0),
            notes=data.get('notes'),
            timestamp=timestamp  # Pass timestamp to model
        )
        
        # Insert into database
        result = db.attendance.insert_one(attendance_log)
        
        if result.inserted_id:
            logger.info(f"Attendance recorded: {data['employee_id']} - {data['event_type']}")
            return jsonify({
                'success': True,
                'message': 'Attendance recorded successfully',
                'data': {
                    'id': str(result.inserted_id),
                    'employee_id': data['employee_id'],
                    'event_type': data['event_type'],
                    'timestamp': attendance_log['timestamp'].isoformat()
                }
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to record attendance'
            }), 500
            
    except Exception as e:
        logger.error(f"Error recording attendance: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@attendance_bp.route('/last/<employee_id>', methods=['GET'])
def get_last_attendance(employee_id):
    """
    Get last attendance record for a user
    Used to determine next action (check-in or check-out)
    """
    try:
        db = get_db()
        attendance = db.attendance.find_one(
            {'employee_id': employee_id},
            sort=[('timestamp', -1)]
        )
        
        if attendance:
            return jsonify({
                'success': True,
                'data': AttendanceModel.to_dict(attendance)
            }), 200
        else:
            return jsonify({
                'success': True,
                'data': None,
                'message': 'No attendance records found'
            }), 200
            
    except Exception as e:
        logger.error(f"Error fetching last attendance: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@attendance_bp.route('/employee/<employee_id>', methods=['GET'])
def get_employee_attendance(employee_id):
    """
    Get attendance records for a specific employee
    Query params: date (optional, defaults to today)
    """
    try:
        db = get_db()
        
        # Get date parameter (defaults to today)
        date_str = request.args.get('date')
        if date_str:
            target_date = datetime.fromisoformat(date_str)
        else:
            target_date = datetime.utcnow()
        
        # Get all records for the day
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        records = list(db.attendance.find({
            'employee_id': employee_id,
            'timestamp': {'$gte': start_of_day, '$lt': end_of_day}
        }).sort('timestamp', 1))
        
        return jsonify({
            'success': True,
            'date': target_date.strftime('%Y-%m-%d'),
            'employee_id': employee_id,
            'attendance': [AttendanceModel.to_dict(r) for r in records],
            'count': len(records)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching employee attendance: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@attendance_bp.route('', methods=['GET'])
def get_attendance():
    """
    Get attendance records with filtering
    Query params: employee_id, start_date, end_date, event_type
    """
    try:
        db = get_db()
        query = {}
        
        # Filter by employee
        if 'employee_id' in request.args:
            query['employee_id'] = request.args.get('employee_id')
        
        # Filter by date range
        if 'start_date' in request.args or 'end_date' in request.args:
            date_filter = {}
            if 'start_date' in request.args:
                date_filter['$gte'] = datetime.fromisoformat(request.args.get('start_date'))
            if 'end_date' in request.args:
                date_filter['$lte'] = datetime.fromisoformat(request.args.get('end_date'))
            query['timestamp'] = date_filter
        
        # Filter by event type
        if 'event_type' in request.args:
            query['event_type'] = request.args.get('event_type')
        
        # Pagination
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        # Get records
        cursor = db.attendance.find(query).sort('timestamp', -1).skip(skip).limit(limit)
        records = list(cursor)
        
        # Get total count
        total = db.attendance.count_documents(query)
        
        return jsonify({
            'success': True,
            'data': [AttendanceModel.to_dict(r) for r in records],
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching attendance: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@attendance_bp.route('/daily-summary/<employee_id>', methods=['GET'])
def get_daily_summary(employee_id):
    """
    Get daily attendance summary for a user
    Returns check-in time, check-out time, and worked hours with lunch break calculation
    """
    try:
        db = get_db()
        date_str = request.args.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
        target_date = datetime.fromisoformat(date_str)
        
        # Get all records for the day
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        records = list(db.attendance.find({
            'employee_id': employee_id,
            'timestamp': {'$gte': start_of_day, '$lt': end_of_day}
        }).sort('timestamp', 1))
        
        # FIX: Return data even for incomplete days
        check_in = next((r for r in records if r['event_type'] == 'check_in'), None)
        check_out = next((r for r in reversed(records) if r['event_type'] == 'check_out'), None)
        
        # Calculate worked hours for complete days
        worked_hours_data = None
        if check_in and check_out:
            attendance_settings = get_attendance_settings()
            worked_hours_data = calculate_worked_hours(
                check_in['timestamp'],
                check_out['timestamp'],
                attendance_settings
            )
        
        return jsonify({
            'success': True,
            'data': {
                'date': date_str,
                'employee_id': employee_id,
                'check_in': check_in['timestamp'].isoformat() if check_in else None,
                'check_out': check_out['timestamp'].isoformat() if check_out else None,
                'worked_hours': worked_hours_data.get('worked_hours') if worked_hours_data else 0,
                'total_hours': worked_hours_data.get('total_hours') if worked_hours_data else 0,
                'lunch_break_hours': worked_hours_data.get('lunch_break_hours') if worked_hours_data else 0,
                'is_complete': worked_hours_data.get('is_complete', False) if worked_hours_data else False,
                'status': 'complete' if check_in and check_out else 'incomplete',
                'total_records': len(records)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching daily summary: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@attendance_bp.route('/export', methods=['GET'])
def export_attendance():
    """
    Export attendance records to CSV
    Query params: same as get_attendance
    """
    try:
        db = get_db()
        query = {}
        
        # Apply same filters as get_attendance
        if 'employee_id' in request.args:
            query['employee_id'] = request.args.get('employee_id')
        
        if 'start_date' in request.args or 'end_date' in request.args:
            date_filter = {}
            if 'start_date' in request.args:
                date_filter['$gte'] = datetime.fromisoformat(request.args.get('start_date'))
            if 'end_date' in request.args:
                date_filter['$lte'] = datetime.fromisoformat(request.args.get('end_date'))
            query['timestamp'] = date_filter
        
        # Get all matching records
        records = list(db.attendance.find(query).sort('timestamp', -1))
        
        # Convert to CSV format
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Employee ID', 'Timestamp', 'Event Type', 'Device ID', 'Match Score'])
        
        # Write data
        for record in records:
            writer.writerow([
                record['employee_id'],
                record['timestamp'].isoformat(),
                record['event_type'],
                record.get('device_id', ''),
                record.get('match_score', '')
            ])
        
        # Return CSV
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename=attendance_export_{datetime.now().strftime("%Y%m%d")}.csv'
            }
        )
        
    except Exception as e:
        logger.error(f"Error exporting attendance: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@attendance_bp.route('/summary', methods=['GET'])
def get_attendance_summary():
    """
    Get attendance summary with worked hours calculation
    Query params: employee_id, start_date, end_date
    Returns daily summaries with worked hours for ALL days in range
    """
    try:
        db = get_db()
        
        # Required parameters
        employee_id = request.args.get('employee_id')
        if not employee_id:
            return jsonify({'success': False, 'error': 'employee_id is required'}), 400
        
        # Date range
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if not start_date_str or not end_date_str:
            return jsonify({'success': False, 'error': 'start_date and end_date are required'}), 400
        
        start_date = datetime.fromisoformat(start_date_str)
        end_date = datetime.fromisoformat(end_date_str)
        
        logger.info(f"Fetching attendance summary for {employee_id} from {start_date_str} to {end_date_str}")
        logger.info(f"Date range: {start_date} to {end_date}")
        logger.info(f"Total days expected: {(end_date - start_date).days + 1}")
        
        # Get attendance settings
        attendance_settings = get_attendance_settings()
        
        # Collect daily summaries for ALL days in range
        daily_summaries = []
        current_date = start_date
        
        while current_date <= end_date:
            start_of_day = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = start_of_day + timedelta(days=1)
            
            # Get ALL records for the day (including duplicates)
            records = list(db.attendance.find({
                'employee_id': employee_id,
                'timestamp': {'$gte': start_of_day, '$lt': end_of_day}
            }).sort('timestamp', 1))
            
            # Get all check-ins and check-outs
            check_ins = [r for r in records if r['event_type'] == 'check_in']
            check_outs = [r for r in records if r['event_type'] == 'check_out']
            
            # For multiple pairs, use the earliest check-in and latest check-out
            check_in = check_ins[0] if check_ins else None
            check_out = check_outs[-1] if check_outs else None
            
            # Calculate worked hours if we have both check-in and check-out
            worked_hours_data = None
            if check_in and check_out:
                worked_hours_data = calculate_worked_hours(
                    check_in['timestamp'],
                    check_out['timestamp'],
                    attendance_settings
                )
            
            # Determine status
            if check_in and check_out:
                status = 'complete'
                is_complete = True
            elif check_in or check_out:
                status = 'partial'
                is_complete = False
            else:
                # Check if there are ANY records for this day
                has_records = len(records) > 0
                status = 'absent' if has_records else 'no_data'
                is_complete = False
            
            # Add day to summaries (ALWAYS add, even if no records)
            daily_summaries.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'day_of_week': current_date.strftime('%a'),
                'has_records': len(records) > 0,
                'check_in': check_in['timestamp'].isoformat() if check_in else None,
                'check_out': check_out['timestamp'].isoformat() if check_out else None,
                'worked_hours': worked_hours_data.get('worked_hours') if worked_hours_data else 0,
                'total_hours': worked_hours_data.get('total_hours') if worked_hours_data else 0,
                'lunch_break_hours': worked_hours_data.get('lunch_break_hours') if worked_hours_data else 0,
                'is_complete': worked_hours_data.get('is_complete', False) if worked_hours_data else False,
                'status': status,
                'total_records': len(records),
                'check_in_count': len(check_ins),
                'check_out_count': len(check_outs)
            })
            
            current_date += timedelta(days=1)
        
        logger.info(f"Generated {len(daily_summaries)} daily summaries")
        logger.info(f"Days with records: {sum(1 for d in daily_summaries if d.get('has_records'))}")
        
        # Calculate totals
        total_days = len(daily_summaries)
        days_with_records = sum(1 for d in daily_summaries if d['has_records'])
        complete_days = sum(1 for d in daily_summaries if d['is_complete'])
        total_worked_hours = sum(d['worked_hours'] for d in daily_summaries)
        
        return jsonify({
            'success': True,
            'data': {
                'employee_id': employee_id,
                'start_date': start_date_str,
                'end_date': end_date_str,
                'daily_summaries': daily_summaries,
                'totals': {
                    'worked_hours': round(total_worked_hours, 2),
                    'complete_days': complete_days,
                    'days_with_records': days_with_records,
                    'total_days': total_days,
                    'absent_days': total_days - days_with_records,
                    'total_records': sum(d['total_records'] for d in daily_summaries)
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching attendance summary: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500