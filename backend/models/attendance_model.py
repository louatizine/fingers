from datetime import datetime
from typing import Optional, Dict, Any
from database import get_db

class AttendanceModel:
    """
    Attendance log model for check-in/check-out events
    """
    
    @staticmethod
    def to_dict(data: dict) -> dict:
        """Convert database document to response dict"""
        if '_id' in data:
            data['_id'] = str(data['_id'])
        return data
    
    @staticmethod
    def validate_attendance(data: dict) -> tuple[bool, Optional[str]]:
        """Validate attendance log data"""
        required = ['employee_id', 'event_type', 'device_id']
        
        for field in required:
            if field not in data:
                return False, f"Missing required field: {field}"
        
        # Validate event type
        if data['event_type'] not in ['check_in', 'check_out']:
            return False, "event_type must be 'check_in' or 'check_out'"
        
        return True, None
    
    @staticmethod
    def create_attendance_log(
        employee_id: str,
        event_type: str,
        device_id: str,
        match_score: int = 0,
        notes: str = None,
        timestamp: datetime = None  # NEW: Optional timestamp parameter
    ) -> Dict[str, Any]:
        """Create attendance log document"""
        log_data = {
            'employee_id': employee_id,
            'event_type': event_type,
            'device_id': device_id,
            'match_score': match_score,
            'notes': notes,
            'created_at': datetime.utcnow()
        }
        
        # Use provided timestamp or current time
        if timestamp:
            log_data['timestamp'] = timestamp
        else:
            log_data['timestamp'] = datetime.utcnow()
            
        return log_data

def create_attendance_log(employee_id, event_type, device_id=None, match_score=0, notes=None, timestamp=None):
    """Create new attendance log entry"""
    db = get_db()
    
    log_data = {
        'employee_id': employee_id,
        'event_type': event_type,
        'device_id': device_id or 'desktop_terminal',
        'match_score': match_score,
        'notes': notes,
        'created_at': datetime.utcnow()
    }
    
    # Use provided timestamp or current time
    if timestamp:
        log_data['timestamp'] = timestamp
    else:
        log_data['timestamp'] = datetime.utcnow()
    
    result = db.attendance.insert_one(log_data)
    log_data['_id'] = str(result.inserted_id)
    
    return log_data

def get_last_attendance(employee_id):
    """Get last attendance log for employee"""
    db = get_db()
    
    log = db.attendance.find_one(
        {'employee_id': employee_id},
        sort=[('timestamp', -1)]
    )
    
    if log:
        log['_id'] = str(log['_id'])
    
    return log