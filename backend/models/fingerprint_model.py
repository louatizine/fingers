from datetime import datetime
from typing import Optional
from database import get_db

class FingerprintModel:
    """
    Fingerprint metadata model (NOT storing raw biometric data)
    Stores only template ID and enrollment metadata
    """
    
    @staticmethod
    def to_dict(data: dict) -> dict:
        """Convert database document to response dict"""
        if '_id' in data:
            data['_id'] = str(data['_id'])
        return data
    
    @staticmethod
    def validate_enrollment(data: dict) -> tuple[bool, Optional[str]]:
        """Validate fingerprint enrollment data"""
        required = ['employee_id', 'template_id', 'device_id']
        
        for field in required:
            if field not in data:
                return False, f"Missing required field: {field}"
        
        return True, None

def update_fingerprint_template(employee_id, template_id, device_id):
    """Update or create fingerprint template for user"""
    db = get_db()
    
    template_data = {
        'employee_id': employee_id,
        'template_id': template_id,
        'device_id': device_id,
        'enrolled_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'is_active': True
    }
    
    # Upsert: update if exists, insert if not
    result = db.fingerprints.update_one(
        {'employee_id': employee_id},
        {'$set': template_data},
        upsert=True
    )
    
    return {
        'success': True,
        'employee_id': employee_id,
        'template_id': template_id
    }

def get_enrolled_templates():
    """Get all enrolled fingerprint templates"""
    db = get_db()
    
    templates = {}
    for template in db.fingerprints.find({'is_active': True}):
        templates[template['employee_id']] = template['template_id']
    
    return templates
