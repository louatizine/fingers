from flask import Blueprint, request, jsonify
from database import get_db
from models.fingerprint_model import FingerprintModel
from datetime import datetime
from models.fingerprint_model import update_fingerprint_template, get_enrolled_templates
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

@fingerprint_bp.route('/pending', methods=['GET'])
def get_pending_enrollments():
    """
    Get list of users pending fingerprint enrollment
    Returns users where has_fingerprint = False or fingerprint_status = 'PENDING'
    Desktop app polls this endpoint to detect new users
    """
    try:
        db = get_db()
        
        # Find users without fingerprints or with pending status
        pending_users = list(db.users.find(
            {
                '$or': [
                    {'has_fingerprint': False},
                    {'has_fingerprint': {'$exists': False}},
                    {'fingerprint_status': 'PENDING'}
                ],
                'is_active': True
            },
            {
                'employee_id': 1,
                'biometric_id': 1,
                'first_name': 1,
                'last_name': 1,
                'full_name': 1,
                'department': 1,
                'position': 1,
                'fingerprint_status': 1,
                'created_at': 1,
                '_id': 0
            }
        ).sort('created_at', -1))
        
        # Add full_name if not present and ensure biometric_id exists
        for user in pending_users:
            if 'full_name' not in user or not user['full_name']:
                user['full_name'] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
            
            # Set default fingerprint_status if not present
            if 'fingerprint_status' not in user:
                user['fingerprint_status'] = 'PENDING'
            
            # Ensure biometric_id exists - if not, generate one
            if 'biometric_id' not in user or not user['biometric_id']:
                # Generate biometric_id from employee_id (e.g., EMP9401 -> 9401)
                employee_id = user.get('employee_id', '')
                if employee_id.startswith('EMP'):
                    try:
                        biometric_id = int(employee_id[3:])
                    except:
                        biometric_id = hash(employee_id) % 100000
                else:
                    biometric_id = hash(employee_id) % 100000
                
                # Update the user with biometric_id
                db.users.update_one(
                    {'employee_id': user['employee_id']},
                    {'$set': {'biometric_id': biometric_id}}
                )
                user['biometric_id'] = biometric_id
        
        return jsonify({
            'success': True,
            'data': pending_users,
            'count': len(pending_users)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching pending enrollments: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@fingerprint_bp.route('/confirm', methods=['POST'])
def confirm_enrollment():
    """
    Confirm successful fingerprint enrollment with optional template backup
    Called by desktop app after successfully enrolling fingerprint on device
    Payload: { "biometric_id": number, "template_data": "base64_string" (optional) }
    """
    try:
        data = request.get_json()
        
        if not data or 'biometric_id' not in data:
            return jsonify({
                'success': False,
                'error': 'biometric_id is required'
            }), 400
        
        biometric_id = data['biometric_id']
        template_data = data.get('template_data')  # Optional Base64 template
        
        db = get_db()
        
        # Find user by biometric_id
        user = db.users.find_one({'biometric_id': biometric_id})
        
        if not user:
            return jsonify({
                'success': False,
                'error': f'User with biometric_id {biometric_id} not found'
            }), 404
        
        employee_id = user.get('employee_id')
        
        # Update user's fingerprint status
        update_data = {
            'has_fingerprint': True,
            'fingerprint_status': 'ENROLLED',
            'fingerprint_device_id': str(biometric_id),
            'fingerprint_enrolled_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Update or create fingerprint record with template data
        fingerprint_data = {
            'employee_id': employee_id,
            'biometric_id': biometric_id,
            'device_id': str(biometric_id),
            'enrolled_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'is_active': True
        }
        
        # Store template data if provided (for backup/migration)
        if template_data:
            fingerprint_data['template_data'] = template_data
            fingerprint_data['template_format'] = 'ZKTeco_Base64'
            fingerprint_data['has_backup'] = True
            logger.info(f"Storing fingerprint template backup for {employee_id} ({len(template_data)} chars)")
        else:
            fingerprint_data['has_backup'] = False
            logger.warning(f"No template data provided for {employee_id}")
        
        # Upsert fingerprint record
        db.fingerprints.update_one(
            {'employee_id': employee_id},
            {'$set': fingerprint_data},
            upsert=True
        )
        
        # Update user record
        result = db.users.update_one(
            {'biometric_id': biometric_id},
            {'$set': update_data}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            logger.info(f"Fingerprint enrollment confirmed for biometric_id {biometric_id} (employee: {employee_id})")
            return jsonify({
                'success': True,
                'message': 'Enrollment confirmed successfully' + (' with template backup' if template_data else ''),
                'data': {
                    'employee_id': employee_id,
                    'biometric_id': biometric_id,
                    'full_name': user.get('full_name') or f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                    'has_template_backup': bool(template_data)
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update enrollment status'
            }), 500
            
    except Exception as e:
        logger.error(f"Error confirming enrollment: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500