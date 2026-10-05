"""
Authentication Utilities
"""
import hmac
from functools import wraps

from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask_jwt_extended.exceptions import JWTExtendedException

from config import Config
from models.user_model import find_user_by_id


def _attendance_api_key_matches() -> bool:
    """True when X-API-Key matches the configured read-only attendance key."""
    expected = (Config.ATTENDANCE_API_KEY or '').strip()
    provided = (request.headers.get('X-API-Key') or '').strip()
    if not expected or not provided:
        return False
    return hmac.compare_digest(provided, expected)


def attendance_read_access(fn):
    """Allow a logged-in app user (Bearer JWT) or the Power Apps API key."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if _attendance_api_key_matches():
            return fn(*args, **kwargs)
        try:
            verify_jwt_in_request()
        except JWTExtendedException:
            return jsonify({
                'success': False,
                'error': 'Authentication required',
            }), 401
        return fn(*args, **kwargs)

    return wrapper

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
