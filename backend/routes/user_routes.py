"""
User Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user_model import (
    create_user, find_user_by_id, update_user, 
    delete_user, get_all_users
)
from utils.auth_utils import admin_required, admin_or_supervisor_required
import logging

logger = logging.getLogger(__name__)

user_bp = Blueprint('users', __name__)

@user_bp.route('', methods=['GET'])
@jwt_required()
@admin_or_supervisor_required
def get_users():
    """Get all users (Admin/Supervisor only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        # If supervisor, only show users from same company
        filters = {}
        if current_user['role'] == 'supervisor':
            filters['company_id'] = current_user['company_id']
        
        users = get_all_users(filters)
        
        return jsonify({'users': users}), 200
        
    except Exception as e:
        logger.error(f"Get users error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


user_bp.route('', methods=['GET'])
@jwt_required()
@admin_or_supervisor_required
def get_users():
    """Get all users (Admin/Supervisor only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Security Logic: Supervisors only see users from their own company
        filters = {}
        if current_user.get('role') == 'supervisor':
            filters['company_id'] = current_user.get('company_id')
        
        users = get_all_users(filters)
        
        return jsonify({
            'success': True,
            'users': users,
            'count': len(users)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/<user_id>/activate', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def activate_user_route(user_id):  # Changed from activate_user to activate_user_route
    """Activate user (Admin or Supervisor)"""
    try:
        from models.user_model import activate_user
        success = activate_user(user_id)
        
        if success:
            return jsonify({'message': 'User activated successfully'}), 200
        else:
            return jsonify({'error': 'User not found'}), 404
        
    except Exception as e:
        logger.error(f"Activate user error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@user_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get user by ID"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        # Users can view their own profile, admins and supervisors can view all
        if current_user_id != user_id and current_user['role'] not in ['admin', 'supervisor']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        user = find_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.pop('password', None)
        
        return jsonify({'user': user}), 200
        
    except Exception as e:
        logger.error(f"Get user error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@user_bp.route('', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def create_new_user():
    """Create new user (Admin or Supervisor)"""
    try:
        data = request.get_json()
        
        # Validate required fields (employee_id is now optional - will auto-generate)
        required_fields = ['email', 'password', 'first_name', 'last_name', 'role', 'company_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create user
        user_id = create_user(data)
        
        return jsonify({
            'message': 'User created successfully',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        logger.error(f"Create user error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@user_bp.route('/<user_id>', methods=['PUT'])
@jwt_required()
def update_user_profile(user_id):
    """Update user profile"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        # Users can update their own profile, admins can update all
        if current_user_id != user_id and current_user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Employees cannot change their role
        if current_user['role'] != 'admin' and 'role' in data:
            data.pop('role')
        
        success = update_user(user_id, data)
        
        if success:
            return jsonify({'message': 'User updated successfully'}), 200
        else:
            return jsonify({'error': 'User not found'}), 404
        
    except Exception as e:
        logger.error(f"Update user error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@user_bp.route('/<user_id>', methods=['DELETE'])
@jwt_required()
@admin_or_supervisor_required
def deactivate_user(user_id):
    """Deactivate user (Admin or Supervisor)"""
    try:
        success = delete_user(user_id)
        
        if success:
            return jsonify({'message': 'User deactivated successfully'}), 200
        else:
            return jsonify({'error': 'User not found'}), 404
        
    except Exception as e:
        logger.error(f"Deactivate user error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@user_bp.route('/<user_id>/activate', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def activate_user(user_id):
    """Activate user (Admin or Supervisor)"""
    try:
        from models.user_model import activate_user as activate
        success = activate(user_id)
        
        if success:
            return jsonify({'message': 'User activated successfully'}), 200
        else:
            return jsonify({'error': 'User not found'}), 404
        
    except Exception as e:
        logger.error(f"Activate user error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@user_bp.route('/public/<employee_id>', methods=['GET'])
def get_user_public(employee_id):
    """Get user by employee ID - Public endpoint for desktop app"""
    try:
        from database import get_db
        db = get_db()
        user = db.users.find_one({'employee_id': employee_id})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Return only basic info (no sensitive data)
        return jsonify({
            'employee_id': user['employee_id'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'email': user.get('email', ''),
            'department': user.get('department', ''),
            'position': user.get('position', '')
        }), 200
        
    except Exception as e:
        logger.error(f"Get public user error: {e}")
        return jsonify({'error': 'An error occurred'}), 500
