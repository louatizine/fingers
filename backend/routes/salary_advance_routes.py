"""
Salary Advance Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.salary_advance_model import (
    create_salary_advance_request, get_salary_advance_by_id,
    get_salary_advances_by_user, get_all_salary_advances,
    update_salary_advance_status, delete_salary_advance, get_salary_advance_statistics
)
from models.user_model import find_user_by_id
from utils.auth_utils import admin_or_supervisor_required
from services.email_service import send_salary_advance_notification
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
        # Supervisors see requests from their company
        elif current_user['role'] == 'supervisor':
            advances = get_all_salary_advances({'company_id': current_user['company_id']})
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
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'reason']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create salary advance request
        advance_data = {
            'user_id': current_user_id,
            'user_name': f"{current_user['first_name']} {current_user['last_name']}",
            'user_email': current_user['email'],
            'company_id': current_user['company_id'],
            'amount': data['amount'],
            'reason': data['reason'],
            'request_date': data.get('request_date')
        }
        
        advance_id = create_salary_advance_request(advance_data)
        
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
        
        advance = get_salary_advance_by_id(advance_id)
        
        if not advance:
            return jsonify({'error': 'Salary advance request not found'}), 404
        
        if advance['status'] != 'pending':
            return jsonify({'error': 'Salary advance request already processed'}), 400
        
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
            
            return jsonify({'message': 'Salary advance request approved'}), 200
        else:
            return jsonify({'error': 'Failed to approve salary advance request'}), 500
        
    except Exception as e:
        logger.error(f"Approve salary advance error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@salary_advance_bp.route('/<advance_id>/reject', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def reject_salary_advance(advance_id):
    """Reject salary advance request"""
    try:
        current_user_id = get_jwt_identity()
        
        advance = get_salary_advance_by_id(advance_id)
        
        if not advance:
            return jsonify({'error': 'Salary advance request not found'}), 404
        
        if advance['status'] != 'pending':
            return jsonify({'error': 'Salary advance request already processed'}), 400
        
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
