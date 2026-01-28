"""
Authentication Utilities
"""
from flask_jwt_extended import get_jwt_identity
from models.user_model import find_user_by_id
from functools import wraps
from flask import jsonify

def admin_required(fn):
    """Decorator to require admin role"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if not current_user or current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        return fn(*args, **kwargs)
    
    return wrapper

def admin_or_supervisor_required(fn):
    """Decorator to require admin or supervisor role"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if not current_user or current_user.get('role') not in ['admin', 'supervisor']:
            return jsonify({'error': 'Admin or Supervisor access required'}), 403
        
        return fn(*args, **kwargs)
    
    return wrapper
