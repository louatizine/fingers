"""
Notification Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from services.email_service import update_smtp_settings, get_smtp_settings, test_smtp_connection
from utils.auth_utils import admin_required
import logging

logger = logging.getLogger(__name__)

notification_bp = Blueprint('email_notifications', __name__)

@notification_bp.route('/smtp-settings', methods=['GET'])
@jwt_required()
@admin_required
def get_smtp_config():
    """Get SMTP settings (Admin only)"""
    try:
        settings = get_smtp_settings()
        # Don't send password to frontend
        settings.pop('password', None)
        
        return jsonify({'smtp_settings': settings}), 200
        
    except Exception as e:
        logger.error(f"Get SMTP settings error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@notification_bp.route('/smtp-settings', methods=['POST'])
@jwt_required()
@admin_required
def update_smtp_config():
    """Update SMTP settings (Admin only)"""
    try:
        data = request.get_json()
        
        required_fields = ['host', 'port', 'username', 'from_email']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        success = update_smtp_settings(data)
        
        if success:
            return jsonify({'message': 'SMTP settings updated successfully'}), 200
        else:
            return jsonify({'error': 'Failed to update SMTP settings'}), 500
        
    except Exception as e:
        logger.error(f"Update SMTP settings error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@notification_bp.route('/test-email', methods=['POST'])
@jwt_required()
@admin_required
def test_email():
    """Test SMTP connection (Admin only)"""
    try:
        data = request.get_json()
        
        if not data or not data.get('test_email'):
            return jsonify({'error': 'test_email is required'}), 400
        
        success, message = test_smtp_connection(data['test_email'])
        
        if success:
            return jsonify({'message': 'Test email sent successfully'}), 200
        else:
            return jsonify({'error': message}), 500
        
    except Exception as e:
        logger.error(f"Test email error: {e}")
        return jsonify({'error': 'An error occurred'}), 500
