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
            # Employee dashboard - show only their own personalized data
            my_leaves = get_all_leaves({'user_id': current_user_id})
            my_salary_advances = get_all_salary_advances({'user_id': current_user_id})
            
            # Calculate leave request statistics by status
            leaves_approved = len([l for l in my_leaves if l.get('status') == 'approved'])
            leaves_pending = len([l for l in my_leaves if l.get('status') == 'pending'])
            leaves_rejected = len([l for l in my_leaves if l.get('status') == 'rejected'])
            
            # Calculate salary advance statistics by status
            advances_approved = len([a for a in my_salary_advances if a.get('status') == 'approved'])
            advances_pending = len([a for a in my_salary_advances if a.get('status') == 'pending'])
            advances_rejected = len([a for a in my_salary_advances if a.get('status') == 'rejected'])
            
            # Calculate total approved amounts
            total_approved_leave_days = sum(l.get('days', 0) for l in my_leaves if l.get('status') == 'approved')
            total_approved_advance_amount = 0
            for a in my_salary_advances:
                if a.get('status') == 'approved':
                    amount = a.get('amount', 0)
                    if isinstance(amount, str):
                        try:
                            total_approved_advance_amount += float(amount)
                        except (ValueError, TypeError):
                            pass
                    else:
                        total_approved_advance_amount += float(amount) if amount else 0
            
            stats = {
                # Personal information
                'employee_name': f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}",
                'employee_id': current_user.get('employee_id', ''),
                'department': current_user.get('department', ''),
                'position': current_user.get('position', ''),
                
                # Leave balance information
                'leave_balance': serialize_doc(current_user.get('leave_balance', {})),
                'vacation_balance': current_user.get('vacation_balance', 0),
                'vacation_earned': current_user.get('vacation_earned', 0),
                'vacation_used': current_user.get('vacation_used', 0),
                
                # Leave requests statistics
                'leaves': {
                    'total': len(my_leaves),
                    'approved': leaves_approved,
                    'pending': leaves_pending,
                    'rejected': leaves_rejected,
                    'total_approved_days': total_approved_leave_days
                },
                
                # Salary advance statistics
                'salary_advances': {
                    'total': len(my_salary_advances),
                    'approved': advances_approved,
                    'pending': advances_pending,
                    'rejected': advances_rejected,
                    'total_approved_amount': total_approved_advance_amount
                },
                
                # Recent activity
                'recent_leaves': serialize_doc(my_leaves[:5]),
                'recent_salary_advances': serialize_doc(my_salary_advances[:5]),
                
                # Legacy stats for compatibility
                'leave_stats': serialize_doc(get_leave_statistics(user_id=current_user_id)),
                'salary_advance_stats': serialize_doc(get_salary_advance_statistics(user_id=current_user_id))
            }
        elif role == 'supervisor':
            # Supervisor dashboard - company-wide data
            company_id = current_user.get('company_id')
            
            if not company_id:
                logger.error(f"Supervisor {current_user_id} has no company_id")
                return jsonify({'error': 'No company assigned'}), 400
            
            # Get employees in same company
            employees = get_all_users({'company_id': company_id})
            company_leaves = get_all_leaves({'company_id': company_id})
            company_advances = get_all_salary_advances({'company_id': company_id})
            company_projects = get_all_projects({'company_id': company_id})
            
            stats = {
                'total_employees': len(employees),
                'leave_stats': serialize_doc(get_leave_statistics(company_id=company_id)),
                'salary_advance_stats': serialize_doc(get_salary_advance_statistics(company_id=company_id)),
                'pending_leaves': len([l for l in company_leaves if l.get('status') == 'pending']),
                'pending_salary_advances': len([a for a in company_advances if a.get('status') == 'pending']),
                'recent_leaves': serialize_doc(company_leaves[:10]),
                'recent_salary_advances': serialize_doc(company_advances[:10]),
                'projects': serialize_doc(company_projects),
                'total_projects': len(company_projects)
            }
        else:  # admin
            # Admin dashboard
            all_employees = get_all_users()
            
            stats = {
                'total_employees': len(all_employees),
                'active_employees': len([e for e in all_employees if e.get('is_active', True)]),
                'leave_stats': serialize_doc(get_leave_statistics()),
                'salary_advance_stats': serialize_doc(get_salary_advance_statistics()),
                'pending_leaves': len(get_all_leaves({'status': 'pending'})),
                'pending_salary_advances': len(get_all_salary_advances({'status': 'pending'})),
                'recent_leaves': serialize_doc(get_all_leaves()[:10]),
                'recent_salary_advances': serialize_doc(get_all_salary_advances()[:10]),
                'total_projects': len(get_all_projects())
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
            pending_leaves = get_all_leaves({'company_id': company_id, 'status': 'pending'})
            pending_advances = get_all_salary_advances({'company_id': company_id, 'status': 'pending'})
        else:
            pending_leaves = get_all_leaves({'status': 'pending'})
            pending_advances = get_all_salary_advances({'status': 'pending'})
        
        return jsonify({
            'pending_leaves': serialize_doc(pending_leaves),
            'pending_salary_advances': serialize_doc(pending_advances)
        }), 200
        
    except Exception as e:
        logger.error(f"Pending approvals error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

# Import decorator
from utils.auth_utils import admin_or_supervisor_required
