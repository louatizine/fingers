"""
Leave Routes
"""
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.leave_model import (
    create_leave_request, get_leave_by_id, get_leaves_by_user,
    get_all_leaves, update_leave_status, delete_leave, get_leave_statistics
)
from models.user_model import find_user_by_id, update_leave_balance, get_vacation_balance, update_vacation_usage
from utils.auth_utils import admin_or_supervisor_required
from utils.org_permissions import can_approve_request, supervisor_visible_department_ids
from services.email_service import send_leave_notification
from datetime import datetime
from models.notif_model import create_notification
from models.audit_model import write_app_audit
from database import get_db
import logging
from pathlib import Path
from werkzeug.utils import secure_filename
import uuid

logger = logging.getLogger(__name__)

leave_bp = Blueprint('leaves', __name__)
LEAVE_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024
LEAVE_ATTACHMENT_DIR = Path(__file__).resolve().parents[1] / 'uploads' / 'leaves'

@leave_bp.route('', methods=['GET'])
@jwt_required()
def get_leaves():
    """Get leave requests"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        # Employees see only their leaves
        if current_user['role'] == 'employee':
            leaves = get_leaves_by_user(current_user_id)
        # Supervisors see leaves from their company (dept-scoped when they manage departments)
        elif current_user['role'] == 'supervisor':
            leaves = get_all_leaves({'company_id': current_user['company_id']})
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
                leaves = [leave for leave in leaves if str(leave.get('user_id')) in allowed_users]
        # Admins see all leaves
        else:
            leaves = get_all_leaves()
        
        return jsonify({'leaves': leaves}), 200
        
    except Exception as e:
        logger.error(f"Get leaves error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@leave_bp.route('/<leave_id>', methods=['GET'])
@jwt_required()
def get_leave(leave_id):
    """Get leave request by ID"""
    try:
        leave = get_leave_by_id(leave_id)
        
        if not leave:
            return jsonify({'error': 'Leave request not found'}), 404
        
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        # Check authorization
        if leave['user_id'] != current_user_id and current_user['role'] not in ['admin', 'supervisor']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({'leave': leave}), 200
        
    except Exception as e:
        logger.error(f"Get leave error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@leave_bp.route('/<leave_id>/attachment', methods=['GET'])
@jwt_required()
def download_leave_attachment(leave_id):
    """Download a leave attachment after checking the requester's access."""
    try:
        leave = get_leave_by_id(leave_id)
        if not leave or not leave.get('attachment', {}).get('stored_name'):
            return jsonify({'error': 'Attachment not found'}), 404

        current_user = find_user_by_id(get_jwt_identity())
        can_access = (
            leave['user_id'] == get_jwt_identity()
            or current_user['role'] == 'admin'
            or (
                current_user['role'] == 'supervisor'
                and leave.get('company_id') == current_user.get('company_id')
            )
        )
        if not can_access:
            return jsonify({'error': 'Unauthorized'}), 403

        stored_name = Path(leave['attachment']['stored_name']).name
        attachment_path = LEAVE_ATTACHMENT_DIR / stored_name
        if not attachment_path.is_file():
            return jsonify({'error': 'Attachment file is unavailable'}), 404

        return send_file(
            attachment_path,
            as_attachment=True,
            download_name=leave['attachment'].get('original_name', stored_name),
            mimetype=leave['attachment'].get('content_type') or 'application/octet-stream',
        )
    except Exception as e:
        logger.error(f"Download leave attachment error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@leave_bp.route('', methods=['POST'])
@jwt_required()
def create_leave():
    """Create leave request"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        data = request.form.to_dict() if request.content_type and request.content_type.startswith('multipart/form-data') else (request.get_json() or {})
        
        # Validate required fields
        required_fields = ['leave_type', 'start_date', 'end_date', 'days', 'reason']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check leave balance
        leave_type = data['leave_type']
        days = data['days']
        
        # Normalize leave type to lowercase for consistency
        leave_type_normalized = leave_type.lower()
        
        # Check leave balance based on leave type (informational only)
        insufficient_balance = False
        current_balance = 0
        
        if leave_type_normalized == 'annual':
            # For annual leaves, check vacation_balance (calculated from settings)
            current_balance = get_vacation_balance(current_user_id)
            if current_balance < days:
                insufficient_balance = True
        else:
            # For sick and unpaid leaves, check legacy leave_balance
            current_balance = current_user.get('leave_balance', {}).get(leave_type_normalized, 0)
            if current_balance < days:
                insufficient_balance = True
        
        attachment = request.files.get('attachment')
        attachment_data = None
        if attachment and attachment.filename:
            original_name = secure_filename(attachment.filename)
            if not original_name:
                return jsonify({'error': 'Attachment filename is invalid'}), 400

            LEAVE_ATTACHMENT_DIR.mkdir(parents=True, exist_ok=True)
            stored_name = f'{uuid.uuid4().hex}_{original_name}'
            attachment_path = LEAVE_ATTACHMENT_DIR / stored_name
            attachment.save(attachment_path)
            file_size = attachment_path.stat().st_size
            if file_size > LEAVE_ATTACHMENT_MAX_BYTES:
                attachment_path.unlink(missing_ok=True)
                return jsonify({'error': 'Attachment must be 20 MB or smaller'}), 400
            attachment_data = {
                'stored_name': stored_name,
                'original_name': original_name,
                'content_type': attachment.mimetype or 'application/octet-stream',
                'size': file_size,
            }

        # Create leave request
        leave_data = {
            'user_id': current_user_id,
            'user_name': f"{current_user['first_name']} {current_user['last_name']}",
            'user_email': current_user['email'],
            'company_id': current_user['company_id'],
            'leave_type': leave_type_normalized,
            'start_date': data['start_date'],
            'end_date': data['end_date'],
            'days': days,
            'reason': data['reason'],
            'insufficient_balance': insufficient_balance,
            'balance_at_request': current_balance
        }
        if attachment_data:
            leave_data['attachment'] = attachment_data
        
        leave_id = create_leave_request(leave_data)
        
        # Create notification for supervisors/admins
        notification_data = {
            'user_id': current_user_id,
            'title': 'New Leave Request',
            'message': f'{current_user["first_name"]} {current_user["last_name"]} has requested {days} days of {leave_type} leave',
            'type': 'leave_request',
            'related_id': leave_id,
            'priority': 'medium'
        }
        create_notification(notification_data)
        
        # Notify department managers first, else company supervisors
        db = get_db()
        recipient_ids = set()
        department_id = current_user.get('departmentId')
        if department_id:
            from models.department_model import get_department
            department = get_department(department_id, current_user.get('company_id'))
            for manager_id in (department or {}).get('managerIds') or []:
                recipient_ids.add(str(manager_id))
        if not recipient_ids:
            supervisors = db.users.find({
                'company_id': current_user['company_id'],
                'role': 'supervisor',
                'is_active': True
            })
            for supervisor in supervisors:
                recipient_ids.add(str(supervisor['_id']))
        
        for recipient_id in recipient_ids:
            create_notification({
                'user_id': recipient_id,
                'title': 'New Leave Request Needs Review',
                'message': f'{current_user["first_name"]} {current_user["last_name"]} has requested {days} days of {leave_type} leave',
                'type': 'leave_request',
                'related_id': leave_id,
                'priority': 'high',
                'company_id': current_user.get('company_id'),
            })
        
        return jsonify({
            'message': 'Leave request created successfully',
            'leave_id': leave_id,
            'insufficient_balance': insufficient_balance,
            'current_balance': current_balance,
            'requested_days': days
        }), 201
        
    except Exception as e:
        logger.error(f"Create leave error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@leave_bp.route('/<leave_id>/approve', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def approve_leave(leave_id):
    """Approve leave request"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        leave = get_leave_by_id(leave_id)
        
        if not leave:
            return jsonify({'error': 'Leave request not found'}), 404
        
        if leave['status'] != 'pending':
            return jsonify({'error': 'Leave request already processed'}), 400

        if not can_approve_request(current_user, leave):
            return jsonify({'error': 'You are not allowed to approve this leave request'}), 403
        
        data = request.get_json() or {}
        review_comment = data.get('comment', '')
        
        # Update leave status
        success = update_leave_status(
            leave_id, 
            'approved', 
            current_user_id,
            review_comment
        )
        
        if success:
            # Create notification for the employee
            notification_data = {
                'user_id': leave['user_id'],
                'title': 'Leave Request Approved',
                'message': f'Your {leave["days"]}-day {leave["leave_type"]} leave request has been approved',
                'type': 'leave_status',
                'related_id': leave_id,
                'priority': 'low'
            }
            create_notification(notification_data)
            
            # Deduct from appropriate balance based on leave type
            leave_type_normalized = leave['leave_type'].lower()
            
            if leave_type_normalized == 'annual':
                # For annual leaves, update vacation_used and recalculate balance
                update_vacation_usage(leave['user_id'], leave['days'])
            else:
                # For sick/unpaid leaves, update legacy leave_balance
                update_leave_balance(leave['user_id'], leave_type_normalized, -leave['days'])
            
            # Send email notification
            try:
                send_leave_notification(
                    leave['user_email'],
                    leave['user_name'],
                    leave,
                    'approved',
                    review_comment
                )
            except Exception as e:
                logger.error(f"Email notification error: {e}")

            write_app_audit(leave.get('company_id'), current_user_id, 'leave.approved', 'leave', leave_id, after={'status': 'approved'})
            
            return jsonify({'message': 'Leave request approved'}), 200
        else:
            return jsonify({'error': 'Failed to approve leave request'}), 500
        
    except Exception as e:
        logger.error(f"Approve leave error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@leave_bp.route('/<leave_id>/reject', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def reject_leave(leave_id):
    """Reject leave request"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        leave = get_leave_by_id(leave_id)
        
        if not leave:
            return jsonify({'error': 'Leave request not found'}), 404
        
        if leave['status'] != 'pending':
            return jsonify({'error': 'Leave request already processed'}), 400

        if not can_approve_request(current_user, leave):
            return jsonify({'error': 'You are not allowed to reject this leave request'}), 403
        
        data = request.get_json() or {}
        review_comment = data.get('comment', '')
        
        # Update leave status
        success = update_leave_status(
            leave_id, 
            'rejected', 
            current_user_id,
            review_comment
        )
        
        if success:
            # Create notification for the employee
            notification_data = {
                'user_id': leave['user_id'],
                'title': 'Leave Request Rejected',
                'message': f'Your {leave["days"]}-day {leave["leave_type"]} leave request has been rejected',
                'type': 'leave_status',
                'related_id': leave_id,
                'priority': 'low'
            }
            create_notification(notification_data)
            
            # Send email notification
            try:
                send_leave_notification(
                    leave['user_email'],
                    leave['user_name'],
                    leave,
                    'rejected',
                    review_comment
                )
            except Exception as e:
                logger.error(f"Email notification error: {e}")

            write_app_audit(leave.get('company_id'), current_user_id, 'leave.rejected', 'leave', leave_id, after={'status': 'rejected'})
            
            return jsonify({'message': 'Leave request rejected'}), 200
        else:
            return jsonify({'error': 'Failed to reject leave request'}), 500
        
    except Exception as e:
        logger.error(f"Reject leave error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@leave_bp.route('/<leave_id>', methods=['DELETE'])
@jwt_required()
def delete_leave_request(leave_id):
    """Delete leave request (only if pending)"""
    try:
        current_user_id = get_jwt_identity()
        
        leave = get_leave_by_id(leave_id)
        
        if not leave:
            return jsonify({'error': 'Leave request not found'}), 404
        
        if leave['user_id'] != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if leave['status'] != 'pending':
            return jsonify({'error': 'Cannot delete processed leave request'}), 400
        
        success = delete_leave(leave_id)
        
        if success:
            return jsonify({'message': 'Leave request deleted'}), 200
        else:
            return jsonify({'error': 'Failed to delete leave request'}), 500
        
    except Exception as e:
        logger.error(f"Delete leave error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@leave_bp.route('/statistics', methods=['GET'])
@jwt_required()
def leave_statistics():
    """Get leave statistics"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if current_user['role'] == 'employee':
            stats = get_leave_statistics(user_id=current_user_id)
        elif current_user['role'] == 'supervisor':
            stats = get_leave_statistics(company_id=current_user['company_id'])
        else:
            stats = get_leave_statistics()
        
        return jsonify({'statistics': stats}), 200
        
    except Exception as e:
        logger.error(f"Leave statistics error: {e}")
        return jsonify({'error': 'An error occurred'}), 500