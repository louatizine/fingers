"""Team who-is-out calendar."""
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from database import get_db
from models.religious_holiday_model import get_religious_holidays_by_year
from models.user_model import find_user_by_id
from utils.org_permissions import supervisor_visible_department_ids

calendar_bp = Blueprint('calendar', __name__)


@calendar_bp.route('/team-absences', methods=['GET'])
@jwt_required()
def team_absences():
    user = find_user_by_id(get_jwt_identity())
    today = datetime.utcnow().date()
    try:
        start = datetime.fromisoformat(request.args.get('start') or today.replace(day=1).isoformat()).date()
        end = datetime.fromisoformat(request.args.get('end') or (today + timedelta(days=60)).isoformat()).date()
    except ValueError:
        return jsonify({'error': 'Invalid start/end date'}), 400

    company_id = user.get('company_id')
    if user.get('role') == 'admin' and request.args.get('companyId'):
        company_id = request.args.get('companyId')
    department_id = request.args.get('departmentId')
    scope = request.args.get('scope', 'company')

    db = get_db()
    user_query = {'is_active': True}
    if company_id:
        user_query['company_id'] = company_id

    if user.get('role') == 'supervisor' and scope == 'team':
        managed = supervisor_visible_department_ids(user)
        if managed is not None:
            user_query['$or'] = [
                {'departmentId': {'$in': managed}},
                {'departmentId': None},
                {'departmentId': {'$exists': False}},
                {'departmentId': ''},
            ]
    if department_id:
        user_query['departmentId'] = department_id

    employees = list(db.users.find(user_query, {
        'first_name': 1, 'last_name': 1, 'departmentId': 1, 'department': 1, 'company_id': 1, 'role': 1,
    }))
    employee_ids = [str(doc['_id']) for doc in employees]
    employee_map = {str(doc['_id']): doc for doc in employees}

    leaves = list(db.leaves.find({
        'status': 'approved',
        'user_id': {'$in': employee_ids},
        'start_date': {'$lte': end.isoformat()},
        'end_date': {'$gte': start.isoformat()},
    }))

    absences = []
    for leave in leaves:
        employee = employee_map.get(str(leave.get('user_id')))
        if not employee:
            continue
        absences.append({
            '_id': str(leave.get('_id')),
            'type': 'leave',
            'leaveType': leave.get('leave_type'),
            'start': leave.get('start_date'),
            'end': leave.get('end_date'),
            'userId': str(leave.get('user_id')),
            'userName': f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip(),
            'departmentId': employee.get('departmentId'),
            'department': employee.get('department'),
        })

    years = {start.year, end.year}
    holidays = []
    for year in sorted(years):
        for holiday in get_religious_holidays_by_year(year):
            h_start = holiday.get('start_date')
            h_end = holiday.get('end_date') or h_start
            if not h_start:
                continue
            if h_end < start.isoformat() or h_start > end.isoformat():
                continue
            holidays.append({
                '_id': holiday.get('_id'),
                'type': 'holiday',
                'name': holiday.get('name'),
                'start': h_start,
                'end': h_end,
            })

    return jsonify({
        'absences': absences,
        'holidays': holidays,
        'range': {'start': start.isoformat(), 'end': end.isoformat()},
    }), 200
