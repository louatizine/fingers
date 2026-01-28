from flask import Blueprint, request, jsonify
from database import get_db
from models.fingerprint_model import FingerprintModel
from datetime import datetime
import logging

fingerprint_bp = Blueprint('fingerprint', __name__)
logger = logging.getLogger(__name__)

@fingerprint_bp.route('/update-template/<employee_id>', methods=['POST'])
def update_fingerprint_template(employee_id):
    """
    Update fingerprint template metadata for a user
    Desktop app sends template_id and device_id (NOT raw biometric data)
    
    Security: Only metadata is stored, actual template stays on desktop app
    """
    try:
        db = get_db()
        data = request.get_json()
        
        # Validate request
        is_valid, error = FingerprintModel.validate_enrollment({
            'employee_id': employee_id,
            **data
        })
        if not is_valid:
            return jsonify({'success': False, 'error': error}), 400
        
        # Check if user exists
        user = db.users.find_one({'employee_id': employee_id})
        if not user:
            return jsonify({
                'success': False,
                'error': f'User {employee_id} not found'
            }), 404
        
        # Update user with fingerprint metadata
        update_data = {
            'fingerprint_template_id': data['template_id'],
            'device_id': data.get('device_id'),
            'enrolled_at': data.get('enrolled_at', datetime.utcnow()),
            'updated_at': datetime.utcnow()
        }
        
        result = db.users.update_one(
            {'employee_id': employee_id},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            logger.info(f"Fingerprint enrolled for user {employee_id}")
            return jsonify({
                'success': True,
                'message': 'Fingerprint template updated successfully',
                'data': {
                    'employee_id': employee_id,
                    'template_id': data['template_id']
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update fingerprint template'
            }), 500
            
    except Exception as e:
        logger.error(f"Error updating fingerprint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@fingerprint_bp.route('/templates', methods=['GET'])
def get_enrolled_templates():
    """
    Get all enrolled template IDs for verification caching
    Returns only metadata, not biometric data
    """
    try:
        db = get_db()
        users = list(db.users.find(
            {'fingerprint_template_id': {'$exists': True, '$ne': None}},
            {'employee_id': 1, 'fingerprint_template_id': 1, '_id': 0}
        ))
        
        # Create mapping of employee_id -> template_id
        templates = {
            user['employee_id']: user['fingerprint_template_id']
            for user in users
        }
        
        return jsonify({
            'success': True,
            'data': templates,
            'count': len(templates)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching templates: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@fingerprint_bp.route('/enrolled-users', methods=['GET'])
def get_enrolled_users():
    """
    Get list of users with fingerprints enrolled
    """
    try:
        db = get_db()
        users = list(db.users.find(
            {'fingerprint_template_id': {'$exists': True, '$ne': None}},
            {
                'employee_id': 1,
                'first_name': 1,
                'last_name': 1,
                'department': 1,
                'fingerprint_template_id': 1,
                'device_id': 1,
                'enrolled_at': 1,
                '_id': 0
            }
        ))
        
        # Add full_name field
        for user in users:
            user['full_name'] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        
        return jsonify({
            'success': True,
            'data': users,
            'count': len(users)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching enrolled users: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@fingerprint_bp.route('/remove-template/<employee_id>', methods=['DELETE'])
def remove_fingerprint_template(employee_id):
    """
    Remove fingerprint enrollment from a user
    """
    try:
        db = get_db()
        result = db.users.update_one(
            {'employee_id': employee_id},
            {
                '$unset': {
                    'fingerprint_template_id': '',
                    'device_id': '',
                    'enrolled_at': ''
                },
                '$set': {
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"Fingerprint removed for user {employee_id}")
            return jsonify({
                'success': True,
                'message': 'Fingerprint template removed successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'User not found or no template to remove'
            }), 404
            
    except Exception as e:
        logger.error(f"Error removing fingerprint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
