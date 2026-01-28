"""
Terminal Routes (Unauthenticated)
Special routes for biometric desktop terminal - no JWT required
These are trusted device endpoints for fingerprint enrollment and attendance
"""
from flask import Blueprint, request, jsonify
from models.user_model import find_user_by_employee_id, create_user, get_all_users
from models.fingerprint_model import update_fingerprint_template, get_enrolled_templates
from models.attendance_model import create_attendance_log, get_last_attendance
import logging

logger = logging.getLogger(__name__)

terminal_bp = Blueprint('terminal', __name__)

@terminal_bp.route('/next-employee-id', methods=['GET'])
def get_next_employee_id():
    """Get next available employee ID for auto-generation"""
    try:
        from database import get_db
        db = get_db()
        
        # Find the next available employee ID by checking existing IDs
        existing_ids = [doc['employee_id'].strip() for doc in db.users.find({}, {'employee_id': 1}) if 'employee_id' in doc]
        
        # Extract numbers from existing IDs (handle EMP001, EMP0001, etc.)
        existing_numbers = []
        for emp_id in existing_ids:
            emp_id = emp_id.upper().strip()
            if emp_id.startswith('EMP'):
                # Extract the numeric part
                numeric_part = emp_id[3:].strip()
                if numeric_part.isdigit():
                    existing_numbers.append(int(numeric_part))
        
        # Get next available number (always use 4 digits for consistency)
        next_number = max(existing_numbers) + 1 if existing_numbers else 1
        next_employee_id = f"EMP{next_number:04d}"
        
        # Double check this ID doesn't exist (in case of formatting differences)
        while db.users.find_one({'employee_id': next_employee_id}):
            next_number += 1
            next_employee_id = f"EMP{next_number:04d}"
        
        return jsonify({'employee_id': next_employee_id}), 200
        
    except Exception as e:
        logger.error(f"Next employee ID error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@terminal_bp.route('/users/<employee_id>', methods=['GET'])
def get_user_by_employee_id(employee_id):
    """Get user by employee ID (for biometric terminal)"""
    try:
        user = find_user_by_employee_id(employee_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Return sanitized user data (no password)
        user.pop('password', None)
        return jsonify({'data': user}), 200
        
    except Exception as e:
        logger.error(f"Terminal get user error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@terminal_bp.route('/users', methods=['GET'])
def get_all_terminal_users():
    """Get all users (for biometric terminal user list)"""
    try:
        users = get_all_users()
        
        # Remove passwords from all users
        for user in users:
            user.pop('password', None)
        
        return jsonify({'data': users}), 200
        
    except Exception as e:
        logger.error(f"Terminal get all users error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@terminal_bp.route('/users', methods=['POST'])
def create_terminal_user():
    """Create new user from biometric terminal"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['employee_id', 'email', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if employee_id already exists
        existing_user = find_user_by_employee_id(data['employee_id'].strip())
        if existing_user:
            return jsonify({
                'error': f'Employee ID "{data["employee_id"]}" already exists. Please use a different ID or click the refresh button to get a new auto-generated ID.'
            }), 400
        
        # Create user with default password (should be changed via web portal)
        user_data = {
            'employee_id': data['employee_id'].strip(),
            'email': data['email'],
            'password': 'ChangeMe123!',  # Default password
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'role': data.get('role', 'employee'),
            'company_id': data.get('company_id'),
            'department': data.get('department', ''),
            'position': data.get('position', ''),
            'is_active': True
        }
        
        user_id = create_user(user_data)
        
        # Get the created user
        user = find_user_by_employee_id(user_data['employee_id'])
        if user:
            user.pop('password', None)
        
        return jsonify({'data': user}), 201
        
    except Exception as e:
        logger.error(f"Terminal create user error: {e}")
        
        # Check if it's a duplicate key error
        error_str = str(e)
        if 'E11000' in error_str or 'duplicate key' in error_str:
            # Extract the employee_id from the error if possible
            emp_id = data.get('employee_id', 'unknown')
            return jsonify({
                'error': f'Employee ID "{emp_id}" already exists in the database. Please use a different ID.'
            }), 400
        
        return jsonify({'error': str(e)}), 500

@terminal_bp.route('/fingerprint/update-template/<employee_id>', methods=['POST'])
def update_template(employee_id):
    """Update fingerprint template (from biometric terminal)"""
    try:
        data = request.get_json()
        template_id = data.get('template_id')
        device_id = data.get('device_id')
        
        # Save to fingerprints collection (for biometric terminal caching)
        result = update_fingerprint_template(
            employee_id=employee_id,
            template_id=template_id,
            device_id=device_id
        )
        
        # ALSO update users collection (so frontend can query enrolled users)
        from database import get_db
        from datetime import datetime
        db = get_db()
        db.users.update_one(
            {'employee_id': employee_id},
            {
                '$set': {
                    'fingerprint_template_id': template_id,
                    'device_id': device_id,
                    'enrolled_at': datetime.utcnow()
                }
            }
        )
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Terminal update template error: {e}")
        return jsonify({'error': str(e)}), 500

@terminal_bp.route('/fingerprint/templates', methods=['GET'])
def get_templates():
    """Get all enrolled templates (for biometric terminal)"""
    try:
        templates = get_enrolled_templates()
        return jsonify({'data': templates}), 200
        
    except Exception as e:
        logger.error(f"Terminal get templates error: {e}")
        return jsonify({'error': str(e)}), 500

@terminal_bp.route('/attendance', methods=['POST'])
def submit_attendance():
    """Submit attendance log (from biometric terminal)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['employee_id', 'event_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        attendance = create_attendance_log(
            employee_id=data['employee_id'],
            event_type=data['event_type'],
            device_id=data.get('device_id'),
            match_score=data.get('match_score'),
            notes=data.get('notes')
        )
        
        return jsonify({'data': attendance}), 201
        
    except Exception as e:
        logger.error(f"Terminal submit attendance error: {e}")
        return jsonify({'error': str(e)}), 500

@terminal_bp.route('/attendance/last/<employee_id>', methods=['GET'])
def get_last_attendance_record(employee_id):
    """Get last attendance record for employee (from biometric terminal)"""
    try:
        attendance = get_last_attendance(employee_id)
        
        if not attendance:
            return jsonify({'data': None}), 200
        
        return jsonify({'data': attendance}), 200
        
    except Exception as e:
        logger.error(f"Terminal get last attendance error: {e}")
        return jsonify({'error': str(e)}), 500

@terminal_bp.route('/health', methods=['GET'])
def terminal_health():
    """Health check for biometric terminal"""
    return jsonify({
        'status': 'healthy',
        'message': 'Biometric Terminal API is running',
        'endpoint': 'terminal'
    }), 200
