"""Worked hours API — declare totals, resolve mission, approve extras."""
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required

from models.audit_model import write_app_audit
from models.worked_hours_model import (
    count_entries,
    create_entry,
    find_mission_for_date,
    get_entry,
    list_entries,
    set_entry_status,
    soft_delete_entry,
    standard_daily_hours_for_date,
    update_entry,
)
from storage.fleet_storage import FleetStorage, FleetStorageError
from utils.fleet_permissions import (
    current_fleet_user,
    fleet_can_manage,
    fleet_company_id,
    fleet_manager_required,
    fleet_read_required,
)
from database import get_db

worked_hours_bp = Blueprint('worked_hours', __name__)
storage = FleetStorage()


def _json_or_form():
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form.to_dict()
        return data
    return request.get_json() or {}


def _driver_id_for_user(user):
    company_id = fleet_company_id(user)
    if not company_id:
        return None
    driver = get_db().fleet_driver_profiles.find_one({
        'companyId': company_id,
        'userId': str(user['_id']),
        'deletedAt': None,
    })
    return str(driver['_id']) if driver else None


def _pagination():
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 50))))
    except ValueError:
        page, limit = 1, 50
    return page, limit


def _can_access_entry(user, entry):
    if fleet_can_manage(user):
        return True
    own_driver_id = _driver_id_for_user(user)
    return bool(own_driver_id and entry.get('driverId') == own_driver_id)


@worked_hours_bp.route('', methods=['GET'])
@jwt_required()
@fleet_read_required
def list_worked_hours():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    page, limit = _pagination()
    filters = {
        'driver_id': request.args.get('driverId'),
        'client_id': request.args.get('clientId'),
        'status': request.args.get('status'),
        'date_from': request.args.get('dateFrom'),
        'date_to': request.args.get('dateTo'),
    }
    if not fleet_can_manage(user):
        own_driver_id = _driver_id_for_user(user)
        if not own_driver_id:
            return jsonify({
                'entries': [],
                'pagination': {'page': page, 'limit': limit, 'total': 0, 'pages': 0},
            }), 200
        filters['driver_id'] = own_driver_id
    total = count_entries(company_id, **filters)
    entries = list_entries(
        company_id,
        skip=(page - 1) * limit,
        limit=limit,
        **filters,
    )
    return jsonify({
        'entries': entries,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'pages': (total + limit - 1) // limit if limit else 0,
        },
    }), 200


@worked_hours_bp.route('/mission', methods=['GET'])
@jwt_required()
@fleet_read_required
def get_mission_for_date():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    date_str = request.args.get('date')
    driver_id = request.args.get('driverId')
    if not date_str:
        return jsonify({'error': 'date is required'}), 400
    if not fleet_can_manage(user):
        driver_id = _driver_id_for_user(user)
        if not driver_id:
            return jsonify({'error': 'No driver profile linked to this user'}), 400
    elif not driver_id:
        return jsonify({'error': 'driverId is required'}), 400
    mission = find_mission_for_date(company_id, driver_id, date_str)
    standard_hours = standard_daily_hours_for_date(date_str)
    return jsonify({
        'mission': mission,
        'standardHours': standard_hours,
    }), 200


@worked_hours_bp.route('', methods=['POST'])
@jwt_required()
@fleet_read_required
def create_worked_hours():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    data = _json_or_form()
    driver_id = data.get('driverId')
    if not fleet_can_manage(user):
        driver_id = _driver_id_for_user(user)
        if not driver_id:
            return jsonify({'error': 'No driver profile linked to this user'}), 400
    if not driver_id or not data.get('date') or data.get('totalHours') in (None, ''):
        return jsonify({'error': 'driverId, date and totalHours are required'}), 400
    attachment = None
    uploaded = request.files.get('attachment')
    if uploaded and uploaded.filename:
        try:
            attachment = storage.save(uploaded, 'worked_hours')
        except FleetStorageError as exc:
            return jsonify({'error': str(exc)}), 400
    try:
        entry = create_entry({
            'companyId': company_id,
            'driverId': driver_id,
            'date': data.get('date'),
            'totalHours': data.get('totalHours'),
            'clientId': data.get('clientId'),
            'notes': data.get('notes'),
            'status': data.get('status') or 'submitted',
            'attachment': attachment,
        }, get_jwt_identity())
    except ValueError as exc:
        if attachment:
            storage.delete(attachment['storedName'], 'worked_hours')
        return jsonify({'error': str(exc)}), 400
    write_app_audit(
        company_id, get_jwt_identity(), 'worked_hours.created', 'worked_hours',
        entry['_id'], after=entry,
    )
    return jsonify({'entry': entry}), 201


@worked_hours_bp.route('/<entry_id>', methods=['GET'])
@jwt_required()
@fleet_read_required
def get_worked_hours(entry_id):
    user = current_fleet_user()
    entry = get_entry(entry_id, fleet_company_id(user))
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    if not _can_access_entry(user, entry):
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'entry': entry}), 200


@worked_hours_bp.route('/<entry_id>', methods=['PUT'])
@jwt_required()
@fleet_read_required
def update_worked_hours(entry_id):
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    existing = get_entry(entry_id, company_id)
    if not existing:
        return jsonify({'error': 'Entry not found'}), 404
    if not _can_access_entry(user, existing):
        return jsonify({'error': 'Unauthorized'}), 403
    if existing.get('status') == 'approved' and not fleet_can_manage(user):
        return jsonify({'error': 'Approved entries cannot be edited'}), 400
    data = _json_or_form()
    if not fleet_can_manage(user):
        data.pop('driverId', None)
        data['driverId'] = existing['driverId']
    uploaded = request.files.get('attachment')
    previous_attachment = existing.get('attachment')
    if uploaded and uploaded.filename:
        try:
            data['attachment'] = storage.save(uploaded, 'worked_hours')
        except FleetStorageError as exc:
            return jsonify({'error': str(exc)}), 400
    try:
        entry = update_entry(entry_id, data, company_id, allow_status_override=fleet_can_manage(user))
    except ValueError as exc:
        if data.get('attachment') and data['attachment'] != previous_attachment:
            storage.delete(data['attachment']['storedName'], 'worked_hours')
        return jsonify({'error': str(exc)}), 400
    if (
        data.get('attachment')
        and previous_attachment
        and previous_attachment.get('storedName') != data['attachment'].get('storedName')
    ):
        storage.delete(previous_attachment['storedName'], 'worked_hours')
    write_app_audit(
        company_id, get_jwt_identity(), 'worked_hours.updated', 'worked_hours',
        entry_id, before=existing, after=entry,
    )
    return jsonify({'entry': entry}), 200


@worked_hours_bp.route('/<entry_id>/attachment', methods=['GET'])
@jwt_required()
@fleet_read_required
def download_worked_hours_attachment(entry_id):
    user = current_fleet_user()
    entry = get_entry(entry_id, fleet_company_id(user))
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    if not _can_access_entry(user, entry):
        return jsonify({'error': 'Unauthorized'}), 403
    attachment = entry.get('attachment')
    if not attachment or not attachment.get('storedName'):
        return jsonify({'error': 'No attachment'}), 404
    try:
        path = storage.get_path(attachment['storedName'], 'worked_hours')
    except FleetStorageError as exc:
        return jsonify({'error': str(exc)}), 400
    if not path.is_file():
        return jsonify({'error': 'Attachment file missing'}), 404
    return send_file(
        path,
        mimetype=attachment.get('contentType') or 'application/octet-stream',
        as_attachment=True,
        download_name=attachment.get('originalName') or attachment['storedName'],
    )


@worked_hours_bp.route('/<entry_id>/approve', methods=['POST'])
@jwt_required()
@fleet_manager_required
def approve_worked_hours(entry_id):
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    before = get_entry(entry_id, company_id)
    if not before:
        return jsonify({'error': 'Entry not found'}), 404
    entry = set_entry_status(entry_id, company_id, 'approved', get_jwt_identity())
    write_app_audit(
        company_id, get_jwt_identity(), 'worked_hours.approved', 'worked_hours',
        entry_id, before=before, after=entry,
    )
    return jsonify({'entry': entry}), 200


@worked_hours_bp.route('/<entry_id>/reject', methods=['POST'])
@jwt_required()
@fleet_manager_required
def reject_worked_hours(entry_id):
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    before = get_entry(entry_id, company_id)
    if not before:
        return jsonify({'error': 'Entry not found'}), 404
    data = request.get_json() or {}
    entry = set_entry_status(
        entry_id, company_id, 'rejected', get_jwt_identity(),
        review_note=data.get('reason') or data.get('reviewNote'),
    )
    write_app_audit(
        company_id, get_jwt_identity(), 'worked_hours.rejected', 'worked_hours',
        entry_id, before=before, after=entry,
    )
    return jsonify({'entry': entry}), 200


@worked_hours_bp.route('/<entry_id>', methods=['DELETE'])
@jwt_required()
@fleet_manager_required
def delete_worked_hours(entry_id):
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    before = get_entry(entry_id, company_id)
    if not soft_delete_entry(entry_id, company_id):
        return jsonify({'error': 'Entry not found'}), 404
    write_app_audit(
        company_id, get_jwt_identity(), 'worked_hours.deleted', 'worked_hours',
        entry_id, before=before,
    )
    return jsonify({'message': 'Entry archived'}), 200
