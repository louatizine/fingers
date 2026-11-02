"""Company / department approval scoping helpers."""
from models.department_model import departments_managed_by, user_manages_department
from models.user_model import find_user_by_id


def request_employee(request_doc):
    employee_id = request_doc.get('user_id') or request_doc.get('employee_id')
    return find_user_by_id(employee_id) if employee_id else None


def same_company(actor, other_user_or_company):
    if not actor:
        return False
    actor_company = actor.get('company_id')
    if isinstance(other_user_or_company, dict):
        other_company = other_user_or_company.get('company_id') or other_user_or_company.get('companyId')
    else:
        other_company = other_user_or_company
    if actor.get('role') == 'admin':
        return True
    return bool(actor_company and other_company and str(actor_company) == str(other_company))


def can_approve_for_employee(actor, employee):
    """Admins: any. Supervisors: same company and (dept manager or no dept managers / unassigned)."""
    if not actor or not employee:
        return False
    if actor.get('role') == 'admin':
        return True
    if actor.get('role') != 'supervisor':
        return False
    if not same_company(actor, employee):
        return False

    department_id = employee.get('departmentId') or employee.get('department_id')
    if not department_id:
        # Unassigned employees: any same-company supervisor can approve
        return True

    managed = departments_managed_by(str(actor['_id']), actor.get('company_id'))
    if not managed:
        # Supervisor with no managed depts keeps company-wide access (legacy)
        return True
    return user_manages_department(str(actor['_id']), department_id)


def can_approve_request(actor, request_doc):
    employee = request_employee(request_doc)
    if not employee:
        # Fall back to company_id stamped on the request
        if actor.get('role') == 'admin':
            return True
        return same_company(actor, request_doc)
    return can_approve_for_employee(actor, employee)


def supervisor_visible_department_ids(actor):
    if not actor or actor.get('role') != 'supervisor':
        return None
    managed = departments_managed_by(str(actor['_id']), actor.get('company_id'))
    if not managed:
        return None  # company-wide
    return [item['_id'] for item in managed]


def filter_users_for_supervisor(users, actor):
    dept_ids = supervisor_visible_department_ids(actor)
    if dept_ids is None:
        return [user for user in users if same_company(actor, user) or actor.get('role') == 'admin']
    return [
        user for user in users
        if same_company(actor, user)
        and (
            not user.get('departmentId')
            or str(user.get('departmentId')) in dept_ids
        )
    ]
