from flask import Blueprint, request, jsonify
from database import get_db
from models.fingerprint_model import FingerprintModel
from datetime import datetime
import logging

fingerprint_bp = Blueprint('fingerprint', __name__)
logger = logging.getLogger(__name__)

@fingerprint_bp.route('/enroll', methods=['POST'])
def enroll_fingerprint():
    """
    Enroll fingerprint for a user
    Desktop app sends template_id and device_id after successful enrollment
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        required_fields = ['employee_id', 'template_id', 'device_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        employee_id = data['employee_id']
        template_id = data['template_id']
        device_id = data['device_id']
        
        # Check if user exists
        db = get_db()
        user = db.users.find_one({'employee_id': employee_id})
        if not user:
            return jsonify({
                'success': False,
                'error': f'User {employee_id} not found'
            }), 404
        
        # Check if already enrolled
        existing = FingerprintModel.get_user_fingerprint(employee_id)
        if existing:
            return jsonify({
                'success': False,
                'error': f'User {employee_id} already has fingerprint enrolled'
            }), 400
        
        # Enroll fingerprint
        result = FingerprintModel.enroll_user(employee_id, template_id, device_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Fingerprint enrolled successfully',
                'data': {
                    'employee_id': employee_id,
                    'template_id': template_id,
                    'device_id': device_id,
                    'enrolled_at': datetime.utcnow().isoformat()
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to enroll fingerprint'
            }), 500
            
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error enrolling fingerprint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@fingerprint_bp.route('/update-status/<employee_id>', methods=['POST'])
def update_fingerprint_status(employee_id):
    """
    Update fingerprint status only (when C# app enrolls user on device)
    This endpoint is called after successful device enrollment
    """
    try:
        db = get_db()
        data = request.get_json()
        
        # Check if user exists
        user = db.users.find_one({'employee_id': employee_id})
        if not user:
            return jsonify({
                'success': False,
                'error': f'User {employee_id} not found'
            }), 404
        
        # Generate a template ID (device user ID)
        device_user_id = data.get('device_user_id')
        if not device_user_id:
            # Generate from employee ID (e.g., EMP9401 -> 9401)
            if employee_id.startswith('EMP'):
                try:
                    device_user_id = employee_id[3:]  # Remove 'EMP' prefix
                except:
                    device_user_id = str(hash(employee_id) % 10000)
            else:
                device_user_id = str(hash(employee_id) % 10000)
        
        # Update user's fingerprint status
        update_data = {
            'has_fingerprint': True,
            'fingerprint_device_id': device_user_id,
            'fingerprint_enrolled_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = db.users.update_one(
            {'employee_id': employee_id},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            logger.info(f"Fingerprint status updated for user {employee_id}")
            return jsonify({
                'success': True,
                'message': 'Fingerprint status updated successfully',
                'data': {
                    'employee_id': employee_id,
                    'device_user_id': device_user_id
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update fingerprint status'
            }), 500
            
    except Exception as e:
        logger.error(f"Error updating fingerprint status: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@fingerprint_bp.route('/check/<employee_id>', methods=['GET'])
def check_fingerprint(employee_id):
    """
    Check if user has fingerprint enrolled
    """
    try:
        db = get_db()
        
        user = db.users.find_one(
            {'employee_id': employee_id},
            {
                'employee_id': 1,
                'has_fingerprint': 1,
                'fingerprint_device_id': 1,
                'fingerprint_enrolled_at': 1,
                '_id': 0
            }
        )
        
        if not user:
            return jsonify({
                'success': False,
                'error': f'User {employee_id} not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': user
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking fingerprint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@fingerprint_bp.route('/templates', methods=['GET'])
def get_enrolled_templates():
    """
    Get all enrolled template IDs for verification caching
    Returns only metadata, not biometric data
    """
    try:
        templates = FingerprintModel.get_enrolled_templates()
        
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
            {'has_fingerprint': True},
            {
                'employee_id': 1,
                'first_name': 1,
                'last_name': 1,
                'full_name': 1,
                'department': 1,
                'position': 1,
                'fingerprint_device_id': 1,
                'fingerprint_enrolled_at': 1,
                '_id': 0
            }
        ))
        
        # Add full_name if not present
        for user in users:
            if 'full_name' not in user or not user['full_name']:
                user['full_name'] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        
        return jsonify({
            'success': True,
            'data': users,
            'count': len(users)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching enrolled users: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@fingerprint_bp.route('/remove/<employee_id>', methods=['DELETE'])
def remove_fingerprint(employee_id):
    """
    Remove fingerprint enrollment from a user
    """
    try:
        result = FingerprintModel.remove_enrollment(employee_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Fingerprint removed successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to remove fingerprint')
            }), 404
            
    except Exception as e:
        logger.error(f"Error removing fingerprint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500