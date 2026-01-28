"""
Attendance Service - Business logic for attendance calculations
"""
from datetime import datetime, timedelta
from database import get_db
from models.settings_model import get_settings
import logging

logger = logging.getLogger(__name__)


def parse_time(time_str):
    """Parse time string (HH:MM) to time object"""
    try:
        return datetime.strptime(time_str, '%H:%M').time()
    except Exception as e:
        logger.error(f"Error parsing time {time_str}: {e}")
        return None


def get_attendance_settings():
    """Get attendance settings from database"""
    try:
        settings = get_settings()
        if settings and 'attendance' in settings:
            return settings['attendance']
        
        # Return default if not found
        return {
            'check_in_start': '08:00',
            'check_out_end': '17:00',
            'lunch_break_start': '12:00',
            'lunch_break_end': '13:00',
            'working_days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        }
    except Exception as e:
        logger.error(f"Error getting attendance settings: {e}")
        return None


def calculate_worked_hours(check_in_time, check_out_time, attendance_settings=None):
    """
    Calculate worked hours for a day
    
    Args:
        check_in_time: datetime object for check-in
        check_out_time: datetime object for check-out
        attendance_settings: dict with lunch break info
        
    Returns:
        dict with worked_hours, is_complete, and breakdown
    """
    try:
        # Get settings if not provided
        if not attendance_settings:
            attendance_settings = get_attendance_settings()
        
        # Validate inputs
        if not check_in_time or not check_out_time:
            return {
                'worked_hours': 0,
                'is_complete': False,
                'error': 'Missing check-in or check-out time'
            }
        
        # Check if check-out is after check-in
        if check_out_time <= check_in_time:
            return {
                'worked_hours': 0,
                'is_complete': False,
                'error': 'Check-out time must be after check-in time'
            }
        
        # Calculate total time difference in hours
        time_diff = check_out_time - check_in_time
        total_hours = time_diff.total_seconds() / 3600
        
        # Parse lunch break times
        lunch_start = parse_time(attendance_settings.get('lunch_break_start', '12:00'))
        lunch_end = parse_time(attendance_settings.get('lunch_break_end', '13:00'))
        
        # Calculate lunch break duration
        lunch_duration_hours = 0
        if lunch_start and lunch_end:
            # Create datetime objects for lunch break on the same day
            lunch_start_dt = datetime.combine(check_in_time.date(), lunch_start)
            lunch_end_dt = datetime.combine(check_in_time.date(), lunch_end)
            
            # Check if employee worked across lunch break
            # If check-in is before lunch end AND check-out is after lunch start
            if check_in_time < lunch_end_dt and check_out_time > lunch_start_dt:
                # Employee was present during lunch break, subtract it
                lunch_break = lunch_end_dt - lunch_start_dt
                lunch_duration_hours = lunch_break.total_seconds() / 3600
        
        # Calculate final worked hours
        worked_hours = total_hours - lunch_duration_hours
        
        # Ensure worked hours is not negative
        worked_hours = max(0, worked_hours)
        
        return {
            'worked_hours': round(worked_hours, 2),
            'is_complete': True,
            'total_hours': round(total_hours, 2),
            'lunch_break_hours': round(lunch_duration_hours, 2),
            'check_in_time': check_in_time.isoformat(),
            'check_out_time': check_out_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error calculating worked hours: {e}")
        return {
            'worked_hours': 0,
            'is_complete': False,
            'error': str(e)
        }


def process_daily_attendance(employee_id, target_date):
    """
    Process attendance for a specific day and calculate worked hours
    
    Args:
        employee_id: Employee ID
        target_date: datetime object for the target date
        
    Returns:
        dict with daily attendance summary
    """
    try:
        db = get_db()
        
        # Get all attendance records for the day
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        records = list(db.attendance.find({
            'employee_id': employee_id,
            'timestamp': {'$gte': start_of_day, '$lt': end_of_day}
        }).sort('timestamp', 1))
        
        if not records:
            return {
                'success': False,
                'message': 'No attendance records found for this date'
            }
        
        # Get first check-in and last check-out
        check_in = None
        check_out = None
        
        for record in records:
            if record['event_type'] == 'check_in' and not check_in:
                check_in = record['timestamp']
            if record['event_type'] == 'check_out':
                check_out = record['timestamp']  # Keep updating to get the last one
        
        # Calculate worked hours
        attendance_settings = get_attendance_settings()
        result = calculate_worked_hours(check_in, check_out, attendance_settings)
        
        # Add employee and date info
        result['employee_id'] = employee_id
        result['date'] = target_date.strftime('%Y-%m-%d')
        result['total_records'] = len(records)
        
        return {
            'success': True,
            'data': result
        }
        
    except Exception as e:
        logger.error(f"Error processing daily attendance: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_daily_summary_with_hours(employee_id, target_date):
    """
    Get daily attendance summary with calculated worked hours
    """
    return process_daily_attendance(employee_id, target_date)


def update_attendance_settings(settings_data):
    """
    Update attendance settings
    
    Args:
        settings_data: dict with attendance settings
        
    Returns:
        bool: Success status
    """
    try:
        db = get_db()
        
        # Validate settings
        required_fields = ['check_in_start', 'check_out_end', 'lunch_break_start', 'lunch_break_end']
        for field in required_fields:
            if field not in settings_data:
                logger.error(f"Missing required field: {field}")
                return False
        
        # Validate time format
        for field in required_fields:
            if not parse_time(settings_data[field]):
                logger.error(f"Invalid time format for {field}: {settings_data[field]}")
                return False
        
        # Update settings in database
        existing = db.settings.find_one()
        if existing:
            db.settings.update_one(
                {'_id': existing['_id']},
                {
                    '$set': {
                        'attendance': settings_data,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
        else:
            # Create new settings document
            db.settings.insert_one({
                'attendance': settings_data,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            })
        
        return True
        
    except Exception as e:
        logger.error(f"Error updating attendance settings: {e}")
        return False