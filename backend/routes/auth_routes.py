"""
Authentication Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from models.user_model import find_user_by_email, verify_password, find_user_by_id
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        from database import get_db
        from bson.objectid import ObjectId
        
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email']
        password = data['password']
        
        # Find user
        user = find_user_by_email(email)
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Verify password
        if not verify_password(user, password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create tokens
        access_token = create_access_token(identity=user['_id'])
        refresh_token = create_refresh_token(identity=user['_id'])
        
        # Remove password from response
        user.pop('password', None)
        
        # If employee, check if assigned to any projects
        if user.get('role') == 'employee':
            db = get_db()
            user_object_id = ObjectId(user['_id'])
            user_id_str = str(user['_id'])
            # Check both field names and both ObjectId and string formats for compatibility
            assigned_projects_count = db.projects.count_documents({
                '$or': [
                    {'assigned_users': user_object_id},
                    {'assigned_users': user_id_str},
                    {'assigned_employees': user_object_id},
                    {'assigned_employees': user_id_str}
                ]
            })
            user['has_projects'] = assigned_projects_count > 0
            logger.info(f"Employee {user['email']} login - has {assigned_projects_count} projects assigned (checked ObjectId: {user_object_id}, String: {user_id_str})")
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'An error occurred during login'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        access_token = create_access_token(identity=current_user_id)
        
        return jsonify({
            'access_token': access_token
        }), 200
        
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return jsonify({'error': 'An error occurred during token refresh'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user profile"""
    try:
        from database import get_db
        from bson.objectid import ObjectId
        
        current_user_id = get_jwt_identity()
        user = find_user_by_id(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.pop('password', None)
        
        # If employee, check if assigned to any projects
        if user.get('role') == 'employee':
            db = get_db()
            user_object_id = ObjectId(user['_id'])
            user_id_str = str(user['_id'])
            # Check both field names and both ObjectId and string formats for compatibility
            assigned_projects_count = db.projects.count_documents({
                '$or': [
                    {'assigned_users': user_object_id},
                    {'assigned_users': user_id_str},
                    {'assigned_employees': user_object_id},
                    {'assigned_employees': user_id_str}
                ]
            })
            user['has_projects'] = assigned_projects_count > 0
            logger.info(f"Employee {user['email']} has {assigned_projects_count} projects assigned, has_projects={user['has_projects']}")
        
        return jsonify({'user': user}), 200
        
    except Exception as e:
        logger.error(f"Get current user error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout endpoint (client-side token removal)"""
    return jsonify({'message': 'Logout successful'}), 200
