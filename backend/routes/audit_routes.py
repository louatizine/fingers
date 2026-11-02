"""App-wide audit trail API."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models.audit_model import list_app_audit
from models.user_model import find_user_by_id
from utils.auth_utils import admin_or_supervisor_required

audit_bp = Blueprint('audit', __name__)


@audit_bp.route('', methods=['GET'])
@jwt_required()
@admin_or_supervisor_required
def get_audit_logs():
    user = find_user_by_id(get_jwt_identity())
    try:
        limit = min(200, max(1, int(request.args.get('limit', 100))))
    except ValueError:
        limit = 100
    company_id = None if user.get('role') == 'admin' else user.get('company_id')
    if user.get('role') == 'admin' and request.args.get('companyId'):
        company_id = request.args.get('companyId')
    logs = list_app_audit(company_id=company_id, limit=limit, entity_type=request.args.get('entityType'))
    return jsonify({'logs': logs}), 200
