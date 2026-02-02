from datetime import datetime
from typing import Optional, Dict, Any
from database import get_db
import logging

logger = logging.getLogger(__name__)

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
            if field not in data or not data[field]:
                return False, f"Missing required field: {field}"
        
        return True, None
    
    @staticmethod
    def enroll_user(employee_id: str, template_id: str, device_id: str, template_data: str = None) -> Dict[str, Any]:
        """Enroll fingerprint for a user - updates both fingerprints and users collections"""
        db = get_db()
        
        # Check if user exists
        user = db.users.find_one({'employee_id': employee_id})
        if not user:
            raise ValueError(f"User {employee_id} not found")
        
        # Create fingerprint document
        fingerprint_data = {
            'employee_id': employee_id,
            'template_id': template_id,
            'device_id': device_id,
            'enrolled_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'is_active': True
        }
        
        # Add template data if provided (Base64 encoded)
        if template_data:
            fingerprint_data['template_data'] = template_data
            fingerprint_data['template_format'] = 'ZKTeco_Base64'
            fingerprint_data['has_backup'] = True
            logger.info(f"Storing fingerprint template backup for {employee_id}")
        else:
            fingerprint_data['has_backup'] = False
        
        # Update fingerprints collection
        result = db.fingerprints.update_one(
            {'employee_id': employee_id},
            {'$set': fingerprint_data},
            upsert=True
        )
        
        # Update user's fingerprint status
        user_update = {
            'has_fingerprint': True,
            'fingerprint_template_id': template_id,
            'fingerprint_device_id': device_id,
            'fingerprint_enrolled_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        db.users.update_one(
            {'employee_id': employee_id},
            {'$set': user_update}
        )
        
        logger.info(f"Fingerprint enrolled for user {employee_id}" + 
                   (" with template backup" if template_data else ""))
        
        return {
            'success': True,
            'employee_id': employee_id,
            'template_id': template_id,
            'device_id': device_id,
            'has_backup': bool(template_data)
        }
    
    @staticmethod
    def update_fingerprint_template(employee_id: str, template_id: str, device_id: str) -> Dict[str, Any]:
        """Update fingerprint template for a user"""
        db = get_db()
        
        # Check if user exists
        user = db.users.find_one({'employee_id': employee_id})
        if not user:
            raise ValueError(f"User {employee_id} not found")
        
        # Update fingerprint document
        fingerprint_update = {
            'template_id': template_id,
            'device_id': device_id,
            'updated_at': datetime.utcnow()
        }
        
        result = db.fingerprints.update_one(
            {'employee_id': employee_id},
            {'$set': fingerprint_update}
        )
        
        if result.modified_count > 0:
            # Update user's fingerprint status
            user_update = {
                'fingerprint_template_id': template_id,
                'fingerprint_device_id': device_id,
                'updated_at': datetime.utcnow()
            }
            
            db.users.update_one(
                {'employee_id': employee_id},
                {'$set': user_update}
            )
            
            logger.info(f"Fingerprint template updated for user {employee_id}")
            
            return {
                'success': True,
                'employee_id': employee_id,
                'template_id': template_id,
                'device_id': device_id,
                'message': 'Fingerprint template updated successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Fingerprint not found or no changes made'
            }
    
    @staticmethod
    def remove_enrollment(employee_id: str) -> Dict[str, Any]:
        """Remove fingerprint enrollment for a user"""
        db = get_db()
        
        # Remove from fingerprints collection
        db.fingerprints.delete_one({'employee_id': employee_id})
        
        # Update user's fingerprint status
        user_update = {
            'has_fingerprint': False,
            'fingerprint_template_id': None,
            'fingerprint_device_id': None,
            'fingerprint_enrolled_at': None,
            'updated_at': datetime.utcnow()
        }
        
        result = db.users.update_one(
            {'employee_id': employee_id},
            {'$set': user_update}
        )
        
        if result.modified_count > 0:
            logger.info(f"Fingerprint removed for user {employee_id}")
            return {'success': True, 'message': 'Fingerprint removed successfully'}
        else:
            return {'success': False, 'error': 'User not found'}
    
    @staticmethod
    def get_enrolled_templates() -> Dict[str, str]:
        """Get all enrolled fingerprint templates"""
        db = get_db()
        
        templates = {}
        for template in db.fingerprints.find({'is_active': True}):
            templates[template['employee_id']] = template['template_id']
        
        return templates
    
    @staticmethod
    def get_user_fingerprint(employee_id: str) -> Optional[Dict[str, Any]]:
        """Get fingerprint data for a specific user"""
        db = get_db()
        
        fingerprint = db.fingerprints.find_one({'employee_id': employee_id})
        if fingerprint:
            return {
                'employee_id': fingerprint['employee_id'],
                'template_id': fingerprint['template_id'],
                'device_id': fingerprint['device_id'],
                'enrolled_at': fingerprint['enrolled_at'],
                'is_active': fingerprint.get('is_active', True)
            }
        return None

# Module-level functions for backward compatibility
def update_fingerprint_template(employee_id: str, template_id: str, device_id: str) -> Dict[str, Any]:
    """Wrapper function for backward compatibility"""
    return FingerprintModel.update_fingerprint_template(employee_id, template_id, device_id)

def get_enrolled_templates() -> Dict[str, str]:
    """Wrapper function for backward compatibility"""
    return FingerprintModel.get_enrolled_templates()