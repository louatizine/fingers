"""
Dashboard Routes
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user_model import find_user_by_id, get_all_users
from models.leave_model import get_leave_statistics, get_all_leaves
from models.salary_advance_model import get_salary_advance_statistics, get_all_salary_advances
from models.project_model import get_all_projects
from utils.auth_utils import admin_or_supervisor_required
import logging

logger = logging.getLogger(__name__)

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_dashboard_statistics():
    """Get dashboard statistics based on user role"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        role = current_user['role']
        
        if role == 'employee':
            # Employee dashboard
            stats = {
                'leave_balance': current_user.get('leave_balance', {}),
                'leave_stats': get_leave_statistics(user_id=current_user_id),
                'salary_advance_stats': get_salary_advance_statistics(user_id=current_user_id),
                'recent_leaves': get_all_leaves({'user_id': current_user_id})[:5],
                'recent_salary_advances': get_all_salary_advances({'user_id': current_user_id})[:5]
            }
        elif role == 'supervisor':
            # Supervisor dashboard
            company_id = current_user['company_id']
            
            # Get employees in same company
            employees = get_all_users({'company_id': company_id})
            
            stats = {
                'total_employees': len(employees),
                'leave_stats': get_leave_statistics(company_id=company_id),
                'salary_advance_stats': get_salary_advance_statistics(company_id=company_id),
                'pending_leaves': len(get_all_leaves({'company_id': company_id, 'status': 'pending'})),
                'pending_salary_advances': len(get_all_salary_advances({'company_id': company_id, 'status': 'pending'})),
                'recent_leaves': get_all_leaves({'company_id': company_id})[:10],
                'recent_salary_advances': get_all_salary_advances({'company_id': company_id})[:10],
                'projects': get_all_projects({'company_id': company_id})
            }
        else:  # admin
            # Admin dashboard
            all_employees = get_all_users()
            
            stats = {
                'total_employees': len(all_employees),
                'active_employees': len([e for e in all_employees if e.get('is_active', True)]),
                'leave_stats': get_leave_statistics(),
                'salary_advance_stats': get_salary_advance_statistics(),
                'pending_leaves': len(get_all_leaves({'status': 'pending'})),
                'pending_salary_advances': len(get_all_salary_advances({'status': 'pending'})),
                'recent_leaves': get_all_leaves()[:10],
                'recent_salary_advances': get_all_salary_advances()[:10],
                'total_projects': len(get_all_projects())
            }
        
        return jsonify({'statistics': stats}), 200
        
    except Exception as e:
        logger.error(f"Dashboard statistics error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@dashboard_bp.route('/pending-approvals', methods=['GET'])
@jwt_required()
@admin_or_supervisor_required
def get_pending_approvals():
    """Get pending approvals for supervisor/admin"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if current_user['role'] == 'supervisor':
            company_id = current_user['company_id']
            pending_leaves = get_all_leaves({'company_id': company_id, 'status': 'pending'})
            pending_advances = get_all_salary_advances({'company_id': company_id, 'status': 'pending'})
        else:
            pending_leaves = get_all_leaves({'status': 'pending'})
            pending_advances = get_all_salary_advances({'status': 'pending'})
        
        return jsonify({
            'pending_leaves': pending_leaves,
            'pending_salary_advances': pending_advances
        }), 200
        
    except Exception as e:
        logger.error(f"Pending approvals error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

# Import decorator
from utils.auth_utils import admin_or_supervisor_required
