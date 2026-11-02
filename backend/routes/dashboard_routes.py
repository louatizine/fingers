"""
Dashboard Routes
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user_model import find_user_by_id, count_users
from models.leave_model import get_leave_statistics, get_all_leaves
from models.salary_advance_model import (
    get_salary_advance_statistics,
    get_all_salary_advances,
)
from models.project_model import get_all_projects, count_projects
from utils.auth_utils import admin_or_supervisor_required
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        return {key: serialize_doc(value) for key, value in doc.items()}
    if isinstance(doc, ObjectId):
        return str(doc)
    return doc

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_dashboard_statistics():
    """Get dashboard statistics based on user role"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if not current_user:
            logger.error(f"User not found: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        role = current_user.get('role', 'employee')
        logger.info(f"Loading dashboard for user {current_user_id} with role {role}")
        
        if role == 'employee':
            leave_stats = get_leave_statistics(user_id=current_user_id)
            advance_stats = get_salary_advance_statistics(user_id=current_user_id)
            recent_leaves = get_all_leaves({'user_id': current_user_id}, limit=5)
            recent_advances = get_all_salary_advances({'user_id': current_user_id}, limit=5)

            stats = {
                'employee_name': f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}",
                'employee_id': current_user.get('employee_id', ''),
                'department': current_user.get('department', ''),
                'position': current_user.get('position', ''),
                'leave_balance': serialize_doc(current_user.get('leave_balance', {})),
                'vacation_balance': current_user.get('vacation_balance', 0),
                'vacation_earned': current_user.get('vacation_earned', 0),
                'vacation_used': current_user.get('vacation_used', 0),
                'leaves': {
                    'total': leave_stats.get('total', 0),
                    'approved': leave_stats.get('approved', 0),
                    'pending': leave_stats.get('pending', 0),
                    'rejected': leave_stats.get('rejected', 0),
                    'total_approved_days': leave_stats.get('total_days', 0),
                },
                'salary_advances': {
                    'total': advance_stats.get('total', 0),
                    'approved': advance_stats.get('approved', 0),
                    'pending': advance_stats.get('pending', 0),
                    'rejected': advance_stats.get('rejected', 0),
                    'total_approved_amount': advance_stats.get('total_amount', 0),
                },
                'recent_leaves': serialize_doc(recent_leaves),
                'recent_salary_advances': serialize_doc(recent_advances),
                'leave_stats': serialize_doc(leave_stats),
                'salary_advance_stats': serialize_doc(advance_stats),
            }
        elif role == 'supervisor':
            company_id = current_user.get('company_id')
            
            if not company_id:
                logger.error(f"Supervisor {current_user_id} has no company_id")
                return jsonify({'error': 'No company assigned'}), 400
            
            leave_stats = get_leave_statistics(company_id=company_id)
            advance_stats = get_salary_advance_statistics(company_id=company_id)
            stats = {
                'total_employees': count_users({'company_id': company_id}),
                'leave_stats': serialize_doc(leave_stats),
                'salary_advance_stats': serialize_doc(advance_stats),
                'pending_leaves': leave_stats.get('pending', 0),
                'pending_salary_advances': advance_stats.get('pending', 0),
                'recent_leaves': serialize_doc(get_all_leaves({'company_id': company_id}, limit=10)),
                'recent_salary_advances': serialize_doc(
                    get_all_salary_advances({'company_id': company_id}, limit=10)
                ),
                'projects': serialize_doc(get_all_projects({'company_id': company_id}, limit=20)),
                'total_projects': count_projects({'company_id': company_id}),
            }
        else:  # admin
            leave_stats = get_leave_statistics()
            advance_stats = get_salary_advance_statistics()
            stats = {
                'total_employees': count_users(),
                'active_employees': count_users({'is_active': True}),
                'leave_stats': serialize_doc(leave_stats),
                'salary_advance_stats': serialize_doc(advance_stats),
                'pending_leaves': leave_stats.get('pending', 0),
                'pending_salary_advances': advance_stats.get('pending', 0),
                'recent_leaves': serialize_doc(get_all_leaves(limit=10)),
                'recent_salary_advances': serialize_doc(get_all_salary_advances(limit=10)),
                'total_projects': count_projects(),
            }
        
        return jsonify({'statistics': stats}), 200
        
    except KeyError as e:
        logger.error(f"Dashboard statistics KeyError: {e}", exc_info=True)
        return jsonify({'error': f'Missing required field: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Dashboard statistics error: {e}", exc_info=True)
        return jsonify({'error': 'An error occurred while loading dashboard'}), 500

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
            pending_leaves = get_all_leaves({'company_id': company_id, 'status': 'pending'}, limit=100)
            pending_advances = get_all_salary_advances({'company_id': company_id, 'status': 'pending'}, limit=100)
        else:
            pending_leaves = get_all_leaves({'status': 'pending'}, limit=100)
            pending_advances = get_all_salary_advances({'status': 'pending'}, limit=100)
        
        return jsonify({
            'pending_leaves': serialize_doc(pending_leaves),
            'pending_salary_advances': serialize_doc(pending_advances)
        }), 200
        
    except Exception as e:
        logger.error(f"Pending approvals error: {e}")
        return jsonify({'error': 'An error occurred'}), 500
