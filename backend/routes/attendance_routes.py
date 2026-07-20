from flask import Blueprint, request, jsonify, Response

from database import get_db

from models.daily_attendance_model import DailyAttendanceModel

from datetime import datetime, timedelta

import logging

import csv

from io import StringIO

from zoneinfo import ZoneInfo

from config import Config



from services.daily_attendance_service import (

    build_date_filter,

    get_active_employees,

    get_employee_summaries_in_range,

    get_summaries_for_date,

    query_daily_summaries,

)

from services.zk_attendance_utils import format_timestamp_for_api



attendance_bp = Blueprint('attendance', __name__)

logger = logging.getLogger(__name__)



DEFAULT_LOOKBACK_DAYS = 180





def _local_now() -> datetime:

    return datetime.now(ZoneInfo(Config.ATTENDANCE_TIMEZONE))





def _default_start_date() -> str:

    start = _local_now() - timedelta(days=DEFAULT_LOOKBACK_DAYS)

    return start.strftime('%Y-%m-%d')





def _default_end_date() -> str:

    return _local_now().strftime('%Y-%m-%d')





def _parse_date_str(date_str: str) -> str:

    return datetime.fromisoformat(date_str).strftime('%Y-%m-%d')





def _summary_doc_to_daily_row(doc: dict) -> dict:
    response = DailyAttendanceModel.summary_to_response(doc)
    date_obj = datetime.strptime(doc['date'], '%Y-%m-%d')
    response['day_of_week'] = date_obj.strftime('%a')
    response['status'] = _derive_status(response)
    response['total_records'] = response.get('event_count', 0)
    return response





def _derive_status(summary: dict) -> str:

    if not summary.get('has_records'):

        return 'no_data'

    if summary.get('is_complete'):

        return 'complete'

    if summary.get('pair_count', 0) > 0:

        return 'partial'

    return 'incomplete'





def _empty_day_row(employee_id: str, date_str: str) -> dict:

    date_obj = datetime.strptime(date_str, '%Y-%m-%d')

    return {

        'employee_id': employee_id,

        'date': date_str,

        'day_of_week': date_obj.strftime('%a'),

        'worked_time_display': '00:00',

        'worked_hours': 0,

        'total_worked_hours': 0,

        'total_worked_minutes': 0,

        'event_count': 0,

        'pair_count': 0,

        'unmatched_events': 0,

        'first_event_at': None,

        'last_event_at': None,

        'check_in': None,

        'check_out': None,

        'has_records': False,

        'is_complete': False,

        'status': 'no_data',

        'total_records': 0,

    }





@attendance_bp.route('/manual', methods=['POST'])

@attendance_bp.route('', methods=['POST'])

def create_attendance_deprecated():

    """Raw attendance logs are no longer stored. Use device sync instead."""

    return jsonify({

        'success': False,

        'error': (

            'Raw attendance events are no longer stored. '

            'Run device sync to aggregate worked hours into daily summaries.'

        ),

    }), 410





@attendance_bp.route('/last/<employee_id>', methods=['GET'])

def get_last_attendance(employee_id):

    """Return the most recent daily summary for an employee."""

    try:

        db = get_db()

        summary = db[DailyAttendanceModel.COLLECTION].find_one(

            {'employee_id': employee_id},

            sort=[('date', -1)],

        )



        if summary:

            return jsonify({

                'success': True,

                'data': DailyAttendanceModel.summary_to_response(summary),

            }), 200



        return jsonify({

            'success': True,

            'data': None,

            'message': 'No attendance summaries found',

        }), 200



    except Exception as e:

        logger.error(f'Error fetching last attendance summary: {e}')

        return jsonify({'success': False, 'error': str(e)}), 500





@attendance_bp.route('/employee/<employee_id>', methods=['GET'])

def get_employee_attendance(employee_id):

    """Get daily summaries for a specific employee on a given date."""

    try:

        date_str = request.args.get('date') or _default_end_date()

        date_str = _parse_date_str(date_str)



        db = get_db()

        summary = db[DailyAttendanceModel.COLLECTION].find_one({

            'employee_id': employee_id,

            'date': date_str,

        })



        summaries = []

        if summary:

            summaries.append(DailyAttendanceModel.summary_to_response(summary))



        return jsonify({

            'success': True,

            'date': date_str,

            'employee_id': employee_id,

            'summaries': summaries,

            'count': len(summaries),

        }), 200



    except Exception as e:

        logger.error(f'Error fetching employee attendance: {e}')

        return jsonify({'success': False, 'error': str(e)}), 500





@attendance_bp.route('', methods=['GET'])

def get_attendance():

    """

    List daily worked-hours summaries with filtering.



    Query params: employee_id, start_date, end_date, page, limit

    """

    try:

        db = get_db()

        page = int(request.args.get('page', 1))

        limit = int(request.args.get('limit', 50))



        start_date = request.args.get('start_date')

        end_date = request.args.get('end_date')

        employee_id = request.args.get('employee_id')



        records, total = query_daily_summaries(

            db,

            employee_id=employee_id,

            start_date=start_date,

            end_date=end_date,

            page=page,

            limit=limit,

        )



        date_filter = build_date_filter(start_date, end_date)

        period_query = {'date': date_filter}

        if employee_id:

            period_query['employee_id'] = employee_id



        collection = db[DailyAttendanceModel.COLLECTION]

        period_stats = {

            'total_days': total,

            'total_worked_hours': 0,

            'employees_with_records': 0,

            'start_date': start_date or _default_start_date(),

            'end_date': end_date or _default_end_date(),

        }



        agg = list(collection.aggregate([

            {'$match': period_query},

            {'$group': {

                '_id': None,

                'total_worked_hours': {'$sum': '$total_worked_hours'},

                'employees': {'$addToSet': '$employee_id'},

            }},

        ]))

        if agg:

            period_stats['total_worked_hours'] = round(agg[0].get('total_worked_hours', 0), 2)

            period_stats['employees_with_records'] = len(agg[0].get('employees', []))



        return jsonify({

            'success': True,

            'data': [DailyAttendanceModel.summary_to_response(r) for r in records],

            'pagination': {

                'page': page,

                'limit': limit,

                'total': total,

                'pages': (total + limit - 1) // limit if limit else 0,

            },

            'period_stats': period_stats,

        }), 200



    except Exception as e:

        logger.error(f'Error fetching attendance summaries: {e}')

        return jsonify({'success': False, 'error': str(e)}), 500





@attendance_bp.route('/daily', methods=['GET'])
def get_daily_attendance_all():
    """Get attendance for all employees on a specific date."""
    try:
        date_str = request.args.get('date') or _default_end_date()
        date_str = _parse_date_str(date_str)
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')

        db = get_db()
        employees = get_active_employees(db)
        summaries_by_employee = get_summaries_for_date(db, date_str)

        attendance_rows = []
        present_count = 0
        complete_count = 0
        partial_count = 0
        total_worked_hours = 0.0

        for employee in employees:
            employee_id = employee.get('employee_id')
            if not employee_id:
                continue

            summary_doc = summaries_by_employee.get(employee_id)
            if summary_doc:
                row = _summary_doc_to_daily_row(summary_doc)
            else:
                row = _empty_day_row(employee_id, date_str)

            row['first_name'] = employee.get('first_name', '')
            row['last_name'] = employee.get('last_name', '')
            row['department'] = employee.get('department', '')
            row['position'] = employee.get('position', '')
            attendance_rows.append(row)

            if row.get('has_records'):
                present_count += 1
                total_worked_hours += row.get('worked_hours', 0) or 0

            status = row.get('status')
            if status == 'complete':
                complete_count += 1
            elif status == 'partial':
                partial_count += 1

        total_employees = len(attendance_rows)
        absent_count = total_employees - present_count

        return jsonify({
            'success': True,
            'date': date_str,
            'day_of_week': date_obj.strftime('%a'),
            'attendance': attendance_rows,
            'totals': {
                'total_employees': total_employees,
                'present': present_count,
                'absent': absent_count,
                'complete': complete_count,
                'partial': partial_count,
                'no_data': absent_count,
                'total_worked_hours': round(total_worked_hours, 2),
            },
        }), 200

    except Exception as e:
        logger.error(f'Error fetching daily attendance for all employees: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500


@attendance_bp.route('/daily-summary/<employee_id>', methods=['GET'])

def get_daily_summary(employee_id):

    """Get worked-hours summary for one employee on one date."""

    try:

        db = get_db()

        date_str = request.args.get('date', _default_end_date())

        date_str = _parse_date_str(date_str)



        summary = db[DailyAttendanceModel.COLLECTION].find_one({

            'employee_id': employee_id,

            'date': date_str,

        })



        if not summary:

            return jsonify({

                'success': True,

                'data': _empty_day_row(employee_id, date_str),

            }), 200



        data = _summary_doc_to_daily_row(summary)

        return jsonify({'success': True, 'data': data}), 200



    except Exception as e:

        logger.error(f'Error fetching daily summary: {e}')

        return jsonify({'success': False, 'error': str(e)}), 500





@attendance_bp.route('/export', methods=['GET'])

def export_attendance():

    """Export daily worked-hours summaries to CSV."""

    try:

        db = get_db()

        employee_id = request.args.get('employee_id')

        start_date = request.args.get('start_date')

        end_date = request.args.get('end_date')



        records, _ = query_daily_summaries(

            db,

            employee_id=employee_id,

            start_date=start_date,

            end_date=end_date,

            page=1,

            limit=100000,

        )



        output = StringIO()

        writer = csv.writer(output)

        writer.writerow([

            'Employee ID',

            'Date',

            'Worked Time (HH:MM)',

            'Total Hours',

            'Event Count',

            'Pairs',

            'Unmatched Events',

        ])



        for record in records:

            writer.writerow([

                record['employee_id'],

                record['date'],

                record.get('worked_time_display', '00:00'),

                record.get('total_worked_hours', 0),

                record.get('event_count', 0),

                record.get('pair_count', 0),

                record.get('unmatched_events', 0),

            ])



        return Response(

            output.getvalue(),

            mimetype='text/csv',

            headers={

                'Content-Disposition': (

                    f'attachment; filename=attendance_summaries_{datetime.now().strftime("%Y%m%d")}.csv'

                ),

            },

        )



    except Exception as e:

        logger.error(f'Error exporting attendance summaries: {e}')

        return jsonify({'success': False, 'error': str(e)}), 500





@attendance_bp.route('/summary', methods=['GET'])

def get_attendance_summary():

    """

    Get daily worked-hours summaries for an employee across a date range.



    Query params: employee_id, start_date, end_date

    """

    try:

        employee_id = request.args.get('employee_id')

        if not employee_id:

            return jsonify({'success': False, 'error': 'employee_id is required'}), 400



        start_date_str = request.args.get('start_date')

        end_date_str = request.args.get('end_date')

        if not start_date_str or not end_date_str:

            return jsonify({

                'success': False,

                'error': 'start_date and end_date are required',

            }), 400



        start_date_str = _parse_date_str(start_date_str)

        end_date_str = _parse_date_str(end_date_str)



        db = get_db()

        stored = get_employee_summaries_in_range(

            db,

            employee_id,

            start_date_str,

            end_date_str,

        )



        daily_summaries = []

        current = datetime.strptime(start_date_str, '%Y-%m-%d')

        end = datetime.strptime(end_date_str, '%Y-%m-%d')



        while current <= end:

            day_str = current.strftime('%Y-%m-%d')

            if day_str in stored:

                daily_summaries.append(_summary_doc_to_daily_row(stored[day_str]))

            else:

                daily_summaries.append(_empty_day_row(employee_id, day_str))

            current += timedelta(days=1)



        days_with_records = sum(1 for d in daily_summaries if d['has_records'])

        complete_days = sum(1 for d in daily_summaries if d['is_complete'])

        total_worked_hours = round(

            sum(d['worked_hours'] for d in daily_summaries),

            2,

        )



        return jsonify({

            'success': True,

            'data': {

                'employee_id': employee_id,

                'start_date': start_date_str,

                'end_date': end_date_str,

                'daily_summaries': daily_summaries,

                'totals': {

                    'worked_hours': total_worked_hours,

                    'complete_days': complete_days,

                    'days_with_records': days_with_records,

                    'total_days': len(daily_summaries),

                    'absent_days': len(daily_summaries) - days_with_records,

                    'total_records': sum(d['event_count'] for d in daily_summaries),

                },

            },

        }), 200



    except Exception as e:

        logger.error(f'Error fetching attendance summary: {e}')

        return jsonify({'success': False, 'error': str(e)}), 500





@attendance_bp.route('/user-stats', methods=['GET'])

def get_user_attendance_stats():

    """Aggregate worked-hours statistics per employee."""

    try:

        db = get_db()

        start_date = request.args.get('start_date')

        end_date = request.args.get('end_date')

        date_filter = build_date_filter(start_date, end_date)



        pipeline = [

            {'$match': {'date': date_filter}},

            {'$group': {

                '_id': '$employee_id',

                'days_with_records': {'$sum': 1},

                'total_worked_hours': {'$sum': '$total_worked_hours'},

                'total_worked_minutes': {'$sum': '$total_worked_minutes'},

                'total_events': {'$sum': '$event_count'},

                'first_date': {'$min': '$date'},

                'last_date': {'$max': '$date'},

            }},

            {'$sort': {'total_worked_hours': -1}},

        ]



        attendance_stats = list(db[DailyAttendanceModel.COLLECTION].aggregate(pipeline))



        user_stats = []

        for stat in attendance_stats:

            employee_id = stat['_id']

            user = db.users.find_one({'employee_id': employee_id})



            user_stats.append({

                'employee_id': employee_id,

                'first_name': user.get('first_name', '') if user else '',

                'last_name': user.get('last_name', '') if user else '',

                'department': user.get('department', '') if user else '',

                'position': user.get('position', '') if user else '',

                'days_with_records': stat['days_with_records'],

                'total_worked_hours': round(stat['total_worked_hours'], 2),

                'total_worked_minutes': stat['total_worked_minutes'],

                'total_events': stat['total_events'],

                'first_date': stat.get('first_date'),

                'last_date': stat.get('last_date'),

            })



        return jsonify({

            'success': True,

            'user_stats': user_stats,

            'filters': {

                'start_date': start_date or _default_start_date(),

                'end_date': end_date or _default_end_date(),

            },

        }), 200



    except Exception as e:

        logger.error(f'Error fetching user attendance stats: {e}')

        return jsonify({'success': False, 'error': str(e)}), 500

