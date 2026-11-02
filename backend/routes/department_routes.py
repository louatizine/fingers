"""Department CRUD API."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models.audit_model import write_app_audit
from models.department_model import (
    create_department,
    delete_department,
    get_department,
    list_departments,
    update_department,
)
from models.user_model import find_user_by_id
from utils.auth_utils import admin_or_supervisor_required, admin_required

department_bp = Blueprint('departments', __name__)


@department_bp.route('', methods=['GET'])
@jwt_required()
def get_departments():
    user = find_user_by_id(get_jwt_identity())
    company_id = request.args.get('companyId') or user.get('company_id')
    if user.get('role') != 'admin':
        company_id = user.get('company_id')
    return jsonify({'departments': list_departments(company_id)}), 200


@department_bp.route('/<department_id>', methods=['GET'])
@jwt_required()
def get_one_department(department_id):
    user = find_user_by_id(get_jwt_identity())
    company_id = None if user.get('role') == 'admin' else user.get('company_id')
    department = get_department(department_id, company_id)
    if not department:
        return jsonify({'error': 'Department not found'}), 404
    return jsonify({'department': department}), 200


@department_bp.route('', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def create_department_route():
    user = find_user_by_id(get_jwt_identity())
    data = request.get_json() or {}
    name = str(data.get('name', '')).strip()
    if not name:
        return jsonify({'error': 'Department name is required'}), 400
    company_id = data.get('companyId') or user.get('company_id')
    if user.get('role') != 'admin':
        company_id = user.get('company_id')
    if not company_id:
        return jsonify({'error': 'companyId is required'}), 400
    department = create_department({
        'companyId': company_id,
        'name': name,
        'managerIds': data.get('managerIds') or [],
    }, get_jwt_identity())
    write_app_audit(company_id, get_jwt_identity(), 'department.created', 'department', department['_id'], after=department)
    return jsonify({'department': department}), 201


@department_bp.route('/<department_id>', methods=['PUT'])
@jwt_required()
@admin_or_supervisor_required
def update_department_route(department_id):
    user = find_user_by_id(get_jwt_identity())
    company_id = None if user.get('role') == 'admin' else user.get('company_id')
    data = request.get_json() or {}
    if user.get('role') != 'admin':
        data.pop('companyId', None)
    before = get_department(department_id, company_id)
    department = update_department(department_id, data, company_id)
    if not department:
        return jsonify({'error': 'Department not found'}), 404
    write_app_audit(department['companyId'], get_jwt_identity(), 'department.updated', 'department', department_id, before=before, after=department)
    return jsonify({'department': department}), 200


@department_bp.route('/<department_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_department_route(department_id):
    user = find_user_by_id(get_jwt_identity())
    company_id = None if user.get('role') == 'admin' else user.get('company_id')
    before = get_department(department_id, company_id)
    if not delete_department(department_id, company_id):
        return jsonify({'error': 'Department not found'}), 404
    write_app_audit((before or {}).get('companyId'), get_jwt_identity(), 'department.deleted', 'department', department_id, before=before)
    return jsonify({'message': 'Department archived'}), 200
