"""
Device Sync Routes - Trigger device synchronization
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.auth_utils import admin_required
from models.user_model import find_user_by_id
import subprocess
import threading
import logging
import os

device_sync_bp = Blueprint('device_sync', __name__)
logger = logging.getLogger(__name__)

# Global sync status
sync_status = {
    'running': False,
    'last_sync': None,
    'last_result': None,
    'error': None
}

def run_sync_script():
    """Run the device sync script in background"""
    global sync_status
    try:
        sync_status['running'] = True
        sync_status['error'] = None
        
        # Get the backend directory path
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        script_path = os.path.join(backend_dir, 'simple_device_sync.py')
        
        # Run the sync script
        result = subprocess.run(
            ['python', script_path],
            cwd=backend_dir,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        from datetime import datetime, UTC
        sync_status['last_sync'] = datetime.now(UTC).isoformat()
        
        if result.returncode == 0:
            # Parse output for stats
            output = result.stdout
            sync_status['last_result'] = {
                'success': True,
                'output': output,
                'message': 'Sync completed successfully'
            }
            logger.info(f"Device sync completed successfully")
        else:
            sync_status['last_result'] = {
                'success': False,
                'error': result.stderr or 'Unknown error',
                'message': 'Sync failed'
            }
            logger.error(f"Device sync failed: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        sync_status['error'] = 'Sync timeout - operation took too long'
        logger.error("Device sync timeout")
    except Exception as e:
        sync_status['error'] = str(e)
        logger.error(f"Device sync error: {e}")
    finally:
        sync_status['running'] = False


@device_sync_bp.route('/trigger', methods=['POST'])
@jwt_required()
@admin_required
def trigger_sync():
    """Trigger device synchronization (Admin only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Check if sync is already running
        if sync_status['running']:
            return jsonify({
                'success': False,
                'error': 'Sync already in progress',
                'status': sync_status
            }), 409
        
        # Start sync in background thread
        thread = threading.Thread(target=run_sync_script)
        thread.daemon = True
        thread.start()
        
        logger.info(f"Device sync triggered by {current_user['email']}")
        
        return jsonify({
            'success': True,
            'message': 'Device sync started',
            'status': 'running'
        }), 200
        
    except Exception as e:
        logger.error(f"Error triggering sync: {e}")
        return jsonify({'error': str(e)}), 500


@device_sync_bp.route('/status', methods=['GET'])
@jwt_required()
@admin_required
def get_sync_status():
    """Get current sync status (Admin only)"""
    try:
        return jsonify({
            'success': True,
            'status': sync_status
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting sync status: {e}")
        return jsonify({'error': str(e)}), 500
