"""
Device Sync Routes - Trigger device synchronization
"""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.auth_utils import admin_or_supervisor_required
from models.user_model import find_user_by_id
from services.device_sync_service import run_device_sync_async, sync_status
from config import Config
import logging

device_sync_bp = Blueprint('device_sync', __name__)
logger = logging.getLogger(__name__)

MAX_REBUILD_DAYS = 62


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

        payload = request.get_json(silent=True) or {}
        rebuild_dates, date_error = _rebuild_dates_from_payload(payload)
        if date_error:
            return jsonify({'success': False, 'error': date_error}), 400

        run_device_sync_async(
            triggered_by=current_user.get('email', 'admin'),
            rebuild_dates=rebuild_dates,
        )

        logger.info(
            "Device sync triggered by %s%s",
            current_user['email'],
            f" for {len(rebuild_dates)} day(s)" if rebuild_dates else "",
        )

        return jsonify({
            'success': True,
            'message': 'Device sync started',
            'status': 'running'
        }), 200

    except Exception as e:
        logger.error("Error triggering sync: %s", e)
        return jsonify({'error': str(e)}), 500


@device_sync_bp.route('/info', methods=['GET'])
def get_sync_info():
    """Public read-only sync status (last run time, no credentials)."""
    last_result = sync_status.get('last_result') or {}
    return jsonify({
        'success': True,
        'status': {
            'running': sync_status.get('running', False),
            'last_sync': sync_status.get('last_sync'),
            'auto_sync_enabled': sync_status.get('auto_sync_enabled', False),
            'sync_interval_minutes': sync_status.get('sync_interval_minutes'),
            'sync_times': sync_status.get('sync_times') or [],
            'sync_schedule_label': sync_status.get('sync_schedule_label'),
            'last_success': last_result.get('success'),
            'last_error': sync_status.get('error') or last_result.get('error'),
        },
    }), 200


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


def _parse_iso_date(value):
    if not isinstance(value, str):
        return None
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError:
        return None


def _rebuild_dates_from_payload(payload):
    """
    Read an optional inclusive date range or a list of dates.

    Returns (dates or None, error message or None). None dates means a normal sync.
    """
    if not isinstance(payload, dict):
        return None, 'Invalid sync request'

    raw_dates = payload.get('dates')
    start_raw = payload.get('start_date')
    end_raw = payload.get('end_date')
    has_list = isinstance(raw_dates, list) and len(raw_dates) > 0
    has_range = bool(start_raw or end_raw)
    if not has_list and not has_range:
        return None, None

    if has_list:
        days = []
        for value in raw_dates:
            day = _parse_iso_date(value)
            if day is None:
                return None, 'Each date must be YYYY-MM-DD'
            days.append(day)
        days = sorted(set(days))
    else:
        if not start_raw or not end_raw:
            return None, 'start_date and end_date are both required'
        start = _parse_iso_date(start_raw)
        end = _parse_iso_date(end_raw)
        if start is None or end is None:
            return None, 'Dates must be YYYY-MM-DD'
        if start > end:
            return None, 'The start date must be on or before the end date'
        days = []
        current = start
        while current <= end:
            days.append(current)
            current += timedelta(days=1)

    if len(days) > MAX_REBUILD_DAYS:
        return None, f'Choose {MAX_REBUILD_DAYS} days or fewer'

    today = datetime.now(ZoneInfo(Config.ATTENDANCE_TIMEZONE)).date()
    if days[-1] > today:
        return None, 'Dates cannot be in the future'

    min_day = _parse_iso_date(Config.ZK_SYNC_MIN_DATE)
    if min_day and days[0] < min_day:
        return None, f'Dates must be on or after {min_day.isoformat()}'

    return [day.isoformat() for day in days], None
