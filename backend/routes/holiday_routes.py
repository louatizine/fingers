"""
Religious holiday routes — plan faith-based days per year.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user_model import find_user_by_id
from models.religious_holiday_model import (
    get_religious_holidays_by_year,
    get_religious_holiday_by_id,
    create_religious_holiday,
    update_religious_holiday,
    delete_religious_holiday,
)
from utils.auth_utils import admin_or_supervisor_required
import logging
import re

logger = logging.getLogger(__name__)

holiday_bp = Blueprint('holidays', __name__)

DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def _validate_payload(data, require_name=True):
    if require_name and not (data.get('name') or '').strip():
        return 'Name is required'
    start = data.get('start_date')
    if not start or not DATE_RE.match(start):
        return 'Valid start_date (YYYY-MM-DD) is required'
    end = data.get('end_date') or start
    if not DATE_RE.match(end):
        return 'Valid end_date (YYYY-MM-DD) is required'
    if end < start:
        return 'end_date cannot be before start_date'
    return None


@holiday_bp.route('/religious', methods=['GET'])
@jwt_required()
def list_religious_holidays():
    try:
        year = request.args.get('year')
        if not year:
            return jsonify({'error': 'year query parameter is required'}), 400
        holidays = get_religious_holidays_by_year(year)
        return jsonify({'holidays': holidays}), 200
    except Exception as e:
        logger.error(f"List religious holidays error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@holiday_bp.route('/religious', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def add_religious_holiday():
    try:
        data = request.get_json() or {}
        error = _validate_payload(data)
        if error:
            return jsonify({'error': error}), 400

        current_user_id = get_jwt_identity()
        holiday = create_religious_holiday(data, current_user_id)
        if not holiday:
            return jsonify({'error': 'Failed to create holiday'}), 500
        return jsonify({'holiday': holiday, 'message': 'Religious holiday planned successfully'}), 201
    except Exception as e:
        logger.error(f"Create religious holiday error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@holiday_bp.route('/religious/<holiday_id>', methods=['PUT'])
@jwt_required()
@admin_or_supervisor_required
def edit_religious_holiday(holiday_id):
    try:
        existing = get_religious_holiday_by_id(holiday_id)
        if not existing:
            return jsonify({'error': 'Holiday not found'}), 404

        data = request.get_json() or {}
        merged = {**existing, **data}
        error = _validate_payload(merged)
        if error:
            return jsonify({'error': error}), 400

        holiday = update_religious_holiday(holiday_id, data)
        return jsonify({'holiday': holiday, 'message': 'Religious holiday updated successfully'}), 200
    except Exception as e:
        logger.error(f"Update religious holiday error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@holiday_bp.route('/religious/<holiday_id>', methods=['DELETE'])
@jwt_required()
@admin_or_supervisor_required
def remove_religious_holiday(holiday_id):
    try:
        existing = get_religious_holiday_by_id(holiday_id)
        if not existing:
            return jsonify({'error': 'Holiday not found'}), 404

        if not delete_religious_holiday(holiday_id):
            return jsonify({'error': 'Failed to delete holiday'}), 500
        return jsonify({'message': 'Religious holiday deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Delete religious holiday error: {e}")
        return jsonify({'error': 'An error occurred'}), 500
