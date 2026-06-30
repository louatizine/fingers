"""
Device Sync Routes - Trigger device synchronization
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.auth_utils import admin_or_supervisor_required
from models.user_model import find_user_by_id
from services.device_sync_service import run_device_sync_async, sync_status
import logging

device_sync_bp = Blueprint('device_sync', __name__)
logger = logging.getLogger(__name__)


@device_sync_bp.route('/trigger', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def trigger_sync():
    """Trigger device synchronization (Admin/Supervisor only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)

        if not current_user:
            return jsonify({'error': 'Unauthorized'}), 401

        if sync_status['running']:
            return jsonify({
                'success': False,
                'error': 'Sync already in progress',
                'status': sync_status
            }), 409

        run_device_sync_async(triggered_by=current_user.get('email', 'admin'))

        logger.info("Device sync triggered by %s", current_user['email'])

        return jsonify({
            'success': True,
            'message': 'Device sync started',
            'status': 'running'
        }), 200

    except Exception as e:
        logger.error("Error triggering sync: %s", e)
        return jsonify({'error': str(e)}), 500


@device_sync_bp.route('/status', methods=['GET'])
@jwt_required()
@admin_or_supervisor_required
def get_sync_status():
    """Get current sync status (Admin/Supervisor only)"""
    try:
        return jsonify({
            'success': True,
            'status': sync_status
        }), 200

    except Exception as e:
        logger.error("Error getting sync status: %s", e)
        return jsonify({'error': str(e)}), 500
