"""
Salary Advance Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from datetime import datetime
from models.salary_advance_model import (
    create_salary_advance_request, get_salary_advance_by_id,
    get_salary_advances_by_user, get_all_salary_advances,
    update_salary_advance_status, delete_salary_advance, get_salary_advance_statistics,
    build_repayment_schedule, update_repayment_payment
)
from models.user_model import find_user_by_id
from utils.auth_utils import admin_or_supervisor_required
from utils.org_permissions import can_approve_request, supervisor_visible_department_ids
from services.email_service import send_salary_advance_notification
from models.notif_model import create_notification
from models.audit_model import write_app_audit
from database import get_db
import logging

logger = logging.getLogger(__name__)

salary_advance_bp = Blueprint('salary_advances', __name__)

@salary_advance_bp.route('', methods=['GET'])
@jwt_required()
def get_salary_advances():
    """Get salary advance requests"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        # Employees see only their requests
        if current_user['role'] == 'employee':
            advances = get_salary_advances_by_user(current_user_id)
        # Supervisors see requests from their company (dept-scoped when assigned)
        elif current_user['role'] == 'supervisor':
            advances = get_all_salary_advances({'company_id': current_user['company_id']})
            managed = supervisor_visible_department_ids(current_user)
            if managed is not None:
                db = get_db()
                allowed_users = {
                    str(doc['_id'])
                    for doc in db.users.find({
                        'company_id': current_user['company_id'],
                        '$or': [
                            {'departmentId': {'$in': managed}},
                            {'departmentId': None},
                            {'departmentId': {'$exists': False}},
                            {'departmentId': ''},
                        ],
                    }, {'_id': 1})
                }
                advances = [item for item in advances if str(item.get('user_id')) in allowed_users]
        # Admins see all requests
        else:
            advances = get_all_salary_advances()
        
        return jsonify({'salary_advances': advances}), 200
        
    except Exception as e:
        logger.error(f"Get salary advances error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@salary_advance_bp.route('/<advance_id>', methods=['GET'])
@jwt_required()
def get_salary_advance(advance_id):
    """Get salary advance request by ID"""
    try:
        advance = get_salary_advance_by_id(advance_id)
        
        if not advance:
            return jsonify({'error': 'Salary advance request not found'}), 404
        
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        # Check authorization
        if advance['user_id'] != current_user_id and current_user['role'] not in ['admin', 'supervisor']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({'salary_advance': advance}), 200
        
    except Exception as e:
        logger.error(f"Get salary advance error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@salary_advance_bp.route('', methods=['POST'])
@jwt_required()
def create_salary_advance():
    """Create salary advance request"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        data = request.get_json() or {}
        
        # Validate required fields
        required_fields = ['amount', 'reason']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        try:
            amount = float(data['amount'])
            if amount <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return jsonify({'error': 'Amount must be greater than zero'}), 400
        if not str(data['reason']).strip():
            return jsonify({'error': 'Reason is required'}), 400
        
        target_user_id = current_user_id
        if data.get('target_employee_id'):
            if current_user['role'] not in ['admin', 'supervisor']:
                return jsonify({'error': 'Only administrators and supervisors can create a loan for an employee'}), 403
            target_user = find_user_by_id(data['target_employee_id'])
            if not target_user:
                return jsonify({'error': 'Employee not found'}), 404
            if target_user.get('role') != 'employee':
                return jsonify({'error': 'Loans can only be created for employees'}), 400
            if current_user['role'] == 'supervisor' and target_user.get('company_id') != current_user.get('company_id'):
                return jsonify({'error': 'Unauthorized employee'}), 403
            target_user_id = data['target_employee_id']
        else:
            target_user = current_user

        # Create salary advance request
        advance_data = {
            'user_id': target_user_id,
            'user_name': f"{target_user['first_name']} {target_user['last_name']}",
            'user_email': target_user['email'],
            'company_id': target_user['company_id'],
            'amount': amount,
            'reason': str(data['reason']).strip(),
            'request_date': data.get('request_date') or datetime.utcnow().isoformat()
        }
        
        advance_id = create_salary_advance_request(advance_data)
        
        # Create notification for supervisors/admins
        notification_data = {
            'user_id': target_user_id,
            'title': 'New Salary Advance Request',
            'message': f'A salary advance of ${data["amount"]} was created for {target_user["first_name"]} {target_user["last_name"]}',
            'type': 'salary_advance',
            'related_id': advance_id,
            'priority': 'medium'
        }
        create_notification(notification_data)
        
        # Notify department managers first, else company supervisors
        db = get_db()
        recipient_ids = set()
        department_id = target_user.get('departmentId')
        if department_id:
            from models.department_model import get_department
            department = get_department(department_id, target_user.get('company_id'))
            for manager_id in (department or {}).get('managerIds') or []:
                recipient_ids.add(str(manager_id))
        if not recipient_ids:
            supervisors = db.users.find({
                'company_id': target_user.get('company_id') or current_user.get('company_id'),
                'role': 'supervisor',
                'is_active': True
            })
            for supervisor in supervisors:
                recipient_ids.add(str(supervisor['_id']))

        for recipient_id in recipient_ids:
            create_notification({
                'user_id': recipient_id,
                'title': 'New Salary Advance Request',
                'message': f'A salary advance of ${data["amount"]} was created for {target_user["first_name"]} {target_user["last_name"]}',
                'type': 'salary_advance',
                'related_id': advance_id,
                'priority': 'high',
                'company_id': target_user.get('company_id'),
            })
        
        return jsonify({
            'message': 'Salary advance request created successfully',
            'advance_id': advance_id
        }), 201
        
    except Exception as e:
        logger.error(f"Create salary advance error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@salary_advance_bp.route('/<advance_id>/approve', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def approve_salary_advance(advance_id):
    """Approve salary advance request"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        advance = get_salary_advance_by_id(advance_id)
        
        if not advance:
            return jsonify({'error': 'Salary advance request not found'}), 404
        
        if advance['status'] != 'pending':
            return jsonify({'error': 'Salary advance request already processed'}), 400

        if not can_approve_request(current_user, advance):
            return jsonify({'error': 'You are not allowed to approve this salary advance'}), 403
        
        data = request.get_json() or {}
        review_comment = data.get('comment', '')
        
        # Update status
        success = update_salary_advance_status(
            advance_id, 
            'approved', 
            current_user_id,
            review_comment
        )

        if success:
            db = get_db()
            schedule = build_repayment_schedule(advance.get('amount'), advance.get('request_date') or advance.get('created_at'))
            db.salary_advances.update_one(
                {'_id': ObjectId(advance_id)},
                {'$set': {'repayment_schedule': schedule}},
            )
            # Create notification for the employee
            notification_data = {
                'user_id': advance['user_id'],
                'title': 'Salary Advance Approved',
                'message': f'Your salary advance request of ${advance["amount"]} has been approved',
                'type': 'salary_advance_status',
                'related_id': advance_id,
                'priority': 'low'
            }
            create_notification(notification_data)
            
            # Send email notification
            try:
                send_salary_advance_notification(
                    advance['user_email'],
                    advance['user_name'],
                    advance,
                    'approved',
                    review_comment
                )
            except Exception as e:
                logger.error(f"Email notification error: {e}")

            write_app_audit(advance.get('company_id'), current_user_id, 'salary_advance.approved', 'salary_advance', advance_id, after={'status': 'approved'})
            
            return jsonify({'message': 'Salary advance request approved'}), 200
        else:
            return jsonify({'error': 'Failed to approve salary advance request'}), 500
        
    except Exception as e:
        logger.error(f"Approve salary advance error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@salary_advance_bp.route('/<advance_id>/payments', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def update_salary_payment(advance_id):
    """Mark one approved loan installment as paid or unpaid."""
    try:
        data = request.get_json() or {}
        month = str(data.get('month', '')).strip()
        if not month:
            return jsonify({'error': 'Payment month is required'}), 400
        advance = get_salary_advance_by_id(advance_id)
        if not advance:
            return jsonify({'error': 'Salary advance request not found'}), 404
        if advance.get('status') != 'approved':
            return jsonify({'error': 'Only approved advances have repayments'}), 400
        payment = update_repayment_payment(
            advance_id,
            month,
            bool(data.get('paid')),
            get_jwt_identity(),
        )
        if not payment:
            return jsonify({'error': 'Repayment month not found'}), 404
        return jsonify({'message': 'Repayment updated', 'payment': payment}), 200
    except Exception as e:
        logger.error(f"Update salary payment error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@salary_advance_bp.route('/<advance_id>/reject', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def reject_salary_advance(advance_id):
    """Reject salary advance request"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        advance = get_salary_advance_by_id(advance_id)
        
        if not advance:
            return jsonify({'error': 'Salary advance request not found'}), 404
        
        if advance['status'] != 'pending':
            return jsonify({'error': 'Salary advance request already processed'}), 400

        if not can_approve_request(current_user, advance):
            return jsonify({'error': 'You are not allowed to reject this salary advance'}), 403
        
        data = request.get_json() or {}
        review_comment = data.get('comment', '')
        
        # Update status
        success = update_salary_advance_status(
            advance_id, 
            'rejected', 
            current_user_id,
            review_comment
        )
        
        if success:
            # Create notification for the employee
            notification_data = {
                'user_id': advance['user_id'],
                'title': 'Salary Advance Rejected',
                'message': f'Your salary advance request of ${advance["amount"]} has been rejected',
                'type': 'salary_advance_status',
                'related_id': advance_id,
                'priority': 'low'
            }
            create_notification(notification_data)
            write_app_audit(advance.get('company_id'), current_user_id, 'salary_advance.rejected', 'salary_advance', advance_id, after={'status': 'rejected'})
            
            # Send email notification
            try:
                send_salary_advance_notification(
                    advance['user_email'],
                    advance['user_name'],
                    advance,
                    'rejected',
                    review_comment
                )
            except Exception as e:
                logger.error(f"Email notification error: {e}")
            
            return jsonify({'message': 'Salary advance request rejected'}), 200
        else:
            return jsonify({'error': 'Failed to reject salary advance request'}), 500
        
    except Exception as e:
        logger.error(f"Reject salary advance error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@salary_advance_bp.route('/<advance_id>', methods=['DELETE'])
@jwt_required()
def delete_salary_advance_request(advance_id):
    """Delete salary advance request (only if pending)"""
    try:
        current_user_id = get_jwt_identity()
        
        advance = get_salary_advance_by_id(advance_id)
        
        if not advance:
            return jsonify({'error': 'Salary advance request not found'}), 404
        
        if advance['user_id'] != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if advance['status'] != 'pending':
            return jsonify({'error': 'Cannot delete processed request'}), 400
        
        success = delete_salary_advance(advance_id)
        
        if success:
            return jsonify({'message': 'Salary advance request deleted'}), 200
        else:
            return jsonify({'error': 'Failed to delete request'}), 500
        
    except Exception as e:
        logger.error(f"Delete salary advance error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@salary_advance_bp.route('/statistics', methods=['GET'])
@jwt_required()
def salary_advance_statistics():
    """Get salary advance statistics"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if current_user['role'] == 'employee':
            stats = get_salary_advance_statistics(user_id=current_user_id)
        elif current_user['role'] == 'supervisor':
            stats = get_salary_advance_statistics(company_id=current_user['company_id'])
        else:
            stats = get_salary_advance_statistics()
        
        return jsonify({'statistics': stats}), 200
        
    except Exception as e:
        logger.error(f"Salary advance statistics error: {e}")
        return jsonify({'error': 'An error occurred'}), 500