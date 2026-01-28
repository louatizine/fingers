# app/routes/settings.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.settings_model import get_settings, update_settings_data, create_default_settings
from models.user_model import find_user_by_id, get_all_users
from database import db
from datetime import datetime
from utils.auth_utils import admin_required
from services.attendance_service import (
    get_attendance_settings,
    update_attendance_settings,
    calculate_worked_hours
)
import logging

logger = logging.getLogger(__name__)
settings_bp = Blueprint('settings', __name__)

@settings_bp.route('', methods=['GET'])
@jwt_required()
def get_app_settings():
    """Get application settings"""
    try:
        settings = get_settings()
        if not settings:
            # Create default settings
            settings = create_default_settings()
        
        return jsonify({
            'settings': {
                'language': settings.get('language', 'english'),
                'monthlyVacationDays': settings.get('monthly_vacation_days', 2.5),
                'probationPeriodMonths': settings.get('probation_period_months', 3),
                'includeWeekends': settings.get('include_weekends', False),
                'maxConsecutiveDays': settings.get('max_consecutive_days', 30)
            }
        }), 200
    except Exception as e:
        logger.error(f"Get settings error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@settings_bp.route('', methods=['PUT'])
@jwt_required()
def update_app_settings():
    """Update application settings"""
    try:
        # Check if user is admin or supervisor
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if current_user['role'] not in ['admin', 'supervisor']:
            return jsonify({'error': 'Unauthorized. Only admins and supervisors can update settings.'}), 403
        data = request.get_json()
        
        settings_data = {}
        if 'language' in data:
            settings_data['language'] = data['language']
        if 'monthlyVacationDays' in data:
            settings_data['monthly_vacation_days'] = float(data['monthlyVacationDays'])
        if 'probationPeriodMonths' in data:
            settings_data['probation_period_months'] = int(data['probationPeriodMonths'])
        if 'includeWeekends' in data:
            settings_data['include_weekends'] = bool(data['includeWeekends'])
        if 'maxConsecutiveDays' in data:
            settings_data['max_consecutive_days'] = int(data['maxConsecutiveDays'])
        
        settings_data['updated_at'] = datetime.utcnow()
        
        updated_settings = update_settings_data(settings_data)
        
        return jsonify({'message': 'Settings updated successfully'}), 200
    except Exception as e:
        logger.error(f"Update settings error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@settings_bp.route('/recalculate-balances', methods=['POST'])
@jwt_required()
def recalculate_all_balances():
    """Recalculate vacation balances for all employees"""
    try:
        # Check if user is admin or supervisor
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if current_user['role'] not in ['admin', 'supervisor']:
            return jsonify({'error': 'Unauthorized. Only admins and supervisors can recalculate balances.'}), 403
        settings = get_settings()
        if not settings:
            return jsonify({'error': 'Settings not found'}), 404
        
        employees = list(db.users.find({'role': 'employee'}))
        today = datetime.utcnow()
        
        for employee in employees:
            if employee.get('hire_date'):
                hire_date = employee['hire_date']
                if isinstance(hire_date, str):
                    hire_date = datetime.fromisoformat(hire_date.replace('Z', '+00:00'))
                
                # Calculate months of service
                months_diff = (today.year - hire_date.year) * 12 + (today.month - hire_date.month)
                
                # Exclude probation period
                months_after_probation = max(0, months_diff - settings.get('probation_period_months', 3))
                
                # Calculate earned days
                earned_days = months_after_probation * settings.get('monthly_vacation_days', 2.5)
                
                # Get used vacation days from approved leaves
                used_vacation = list(db.leaves.find({
                    'user_id': str(employee['_id']),
                    'status': 'approved',
                    'leave_type': 'annual'  # Use normalized type
                }))
                
                used_days = sum([leave.get('days', 0) for leave in used_vacation])
                
                # Calculate balance
                balance = earned_days - used_days
                
                # Update employee's vacation balance
                db.users.update_one(
                    {'_id': employee['_id']},
                    {'$set': {
                        'vacation_balance': balance,
                        'vacation_earned': earned_days,
                        'vacation_used': used_days,
                        'updated_at': datetime.utcnow()
                    }}
                )
        
        return jsonify({'message': 'All balances recalculated successfully'}), 200
    except Exception as e:
        logger.error(f"Recalculate balances error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@settings_bp.route('/employee-vacations', methods=['GET'])
@jwt_required()
def get_employee_vacations():
    """Get employee vacation data for display"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        # Check if user is admin or supervisor
        if current_user['role'] not in ['admin', 'supervisor']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        employees = list(db.users.find({'role': 'employee'}))
        
        vacations_data = []
        for employee in employees:
            vacations_data.append({
                '_id': str(employee['_id']),
                'first_name': employee.get('first_name', ''),
                'last_name': employee.get('last_name', ''),
                'email': employee.get('email', ''),
                'position': employee.get('position', ''),
                'hire_date': employee.get('hire_date'),
                'vacation_balance': employee.get('vacation_balance', 0),
                'vacation_earned': employee.get('vacation_earned', 0),
                'vacation_used': employee.get('vacation_used', 0),
                'used_vacation_days': employee.get('vacation_used', 0)
            })
        
        return jsonify({'vacations': vacations_data}), 200
    except Exception as e:
        logger.error(f"Get employee vacations error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@settings_bp.route('/calculate-employee/<employee_id>', methods=['GET'])
@jwt_required()
def calculate_employee_balance(employee_id):
    """Calculate vacation balance for specific employee"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        # Check permissions
        if current_user['role'] not in ['admin', 'supervisor'] and str(current_user_id) != str(employee_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        from bson import ObjectId
        employee = db.users.find_one({'_id': ObjectId(employee_id)})
        
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        settings = get_settings()
        if not settings:
            return jsonify({'error': 'Settings not found'}), 404
        
        today = datetime.utcnow()
        
        if not employee.get('hire_date'):
            return jsonify({
                'earned': 0,
                'used': 0,
                'balance': 0,
                'months_service': 0,
                'months_after_probation': 0,
                'message': 'Hire date not set'
            }), 200
        
        hire_date = employee['hire_date']
        if isinstance(hire_date, str):
            hire_date = datetime.fromisoformat(hire_date.replace('Z', '+00:00'))
        
        # Calculate months of service
        months_diff = (today.year - hire_date.year) * 12 + (today.month - hire_date.month)
        
        # Exclude probation period
        months_after_probation = max(0, months_diff - settings.get('probation_period_months', 3))
        
        # Calculate earned days
        earned_days = months_after_probation * settings.get('monthly_vacation_days', 2.5)
        
        # Get used vacation days
        used_vacation = list(db.leaves.find({
            'user_id': str(employee['_id']),
            'status': 'approved',
            'leave_type': 'annual'
        }))
        
        used_days = sum([leave.get('days', 0) for leave in used_vacation])
        
        # Calculate balance
        balance = earned_days - used_days
        
        return jsonify({
            'earned': round(earned_days, 2),
            'used': round(used_days, 2),
            'balance': round(balance, 2),
            'months_service': months_diff,
            'months_after_probation': months_after_probation,
            'formula': f'({months_after_probation} months × {settings.get("monthly_vacation_days", 2.5)} days) - {used_days} days'
        }), 200
    except Exception as e:
        logger.error(f"Calculate employee balance error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


# ============================================
# Attendance Settings Endpoints
# ============================================

@settings_bp.route('/attendance', methods=['GET'])
@jwt_required()
def get_attendance_settings_endpoint():
    """
    Get attendance settings
    Returns working hours configuration and lunch break settings
    """
    try:
        settings = get_attendance_settings()
        
        if not settings:
            return jsonify({'error': 'Attendance settings not found'}), 404
        
        return jsonify({
            'success': True,
            'data': {
                'checkInStart': settings.get('check_in_start', '08:00'),
                'checkOutEnd': settings.get('check_out_end', '17:00'),
                'lunchBreakStart': settings.get('lunch_break_start', '12:00'),
                'lunchBreakEnd': settings.get('lunch_break_end', '13:00'),
                'workingDays': settings.get('working_days', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get attendance settings error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@settings_bp.route('/attendance', methods=['PUT'])
@jwt_required()
def update_attendance_settings_endpoint():
    """
    Update attendance settings
    Only admin and supervisor can update
    """
    try:
        # Check if user is admin or supervisor
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if current_user['role'] not in ['admin', 'supervisor']:
            return jsonify({
                'success': False,
                'error': 'Unauthorized. Only admins and supervisors can update attendance settings.'
            }), 403
        
        data = request.get_json()
        
        # Build settings data
        settings_data = {
            'check_in_start': data.get('checkInStart', '08:00'),
            'check_out_end': data.get('checkOutEnd', '17:00'),
            'lunch_break_start': data.get('lunchBreakStart', '12:00'),
            'lunch_break_end': data.get('lunchBreakEnd', '13:00'),
            'working_days': data.get('workingDays', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
        }
        
        # Update settings
        success = update_attendance_settings(settings_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Attendance settings updated successfully',
                'data': settings_data
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update attendance settings'
            }), 500
            
    except Exception as e:
        logger.error(f"Update attendance settings error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
