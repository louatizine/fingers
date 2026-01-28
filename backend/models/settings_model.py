"""
Settings Model
"""
from database import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def get_settings():
    """Get application settings"""
    try:
        settings = db.settings.find_one()
        return settings
    except Exception as e:
        logger.error(f"Error getting settings: {e}")
        return None

def create_default_settings():
    """Create default settings"""
    try:
        default_settings = {
            'language': 'english',
            'monthly_vacation_days': 2.5,
            'probation_period_months': 3,
            'include_weekends': False,
            'max_consecutive_days': 30,
            # Attendance settings
            'attendance': {
                'check_in_start': '08:00',
                'check_out_end': '17:00',
                'lunch_break_start': '12:00',
                'lunch_break_end': '13:00',
                'working_days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
            },
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Check if settings already exist
        existing = db.settings.find_one()
        if not existing:
            db.settings.insert_one(default_settings)
            return default_settings
        return existing
    except Exception as e:
        logger.error(f"Error creating default settings: {e}")
        return None

def update_settings_data(settings_data):
    """Update settings"""
    try:
        settings_data['updated_at'] = datetime.utcnow()
        
        # Check if settings exist
        existing = db.settings.find_one()
        if existing:
            db.settings.update_one(
                {'_id': existing['_id']},
                {'$set': settings_data}
            )
        else:
            # Create new settings
            settings_data.update({
                'language': settings_data.get('language', 'english'),
                'monthly_vacation_days': settings_data.get('monthly_vacation_days', 2.5),
                'probation_period_months': settings_data.get('probation_period_months', 3),
                'include_weekends': settings_data.get('include_weekends', False),
                'max_consecutive_days': settings_data.get('max_consecutive_days', 30),
                'created_at': datetime.utcnow()
            })
            db.settings.insert_one(settings_data)
        
        return db.settings.find_one()
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        return None