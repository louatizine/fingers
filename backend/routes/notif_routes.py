"""
Notification Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.notif_model import (
    get_notifications_by_user,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
    delete_notification
)
from models.user_model import find_user_by_id
from database import get_db
from bson.objectid import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

notif_bp = Blueprint('notifications', __name__)

def get_filtered_notifications(user_id, user_role, company_id=None, limit=20):
    """Get notifications filtered by user role"""
    db = get_db()
    user_id_str = str(user_id)
    
    # Base query structure
    query = {'is_read': False}  # Default to unread for counting
    
    if user_role == 'employee':
        # Employees only see their own notifications
        query = {'user_id': user_id_str}
        
    elif user_role == 'supervisor':
        # Supervisors see:
        # 1. Their personal notifications
        # 2. Company-wide notifications for their company
        if company_id:
            query = {
                '$or': [
                    # Personal notifications
                    {'user_id': user_id_str},
                    # Company-wide notifications for supervisors in their company
                    {'company_id': company_id, 'target_roles': {'$in': ['supervisor', 'admin']}}
                ]
            }
        else:
            # Fallback: only personal notifications
            query = {'user_id': user_id_str}
            
    elif user_role == 'admin':
        # Admins see:
        # 1. Their personal notifications
        # 2. All company-wide notifications
        # 3. System notifications
        query = {
            '$or': [
                # Personal notifications
                {'user_id': user_id_str},
                # Company-wide notifications for admins/supervisors
                {'target_roles': {'$in': ['admin', 'supervisor']}},
                # All notifications (admins can see everything)
                {}
            ]
        }
    
    # Get notifications
    cursor = db.notifications.find(query).sort('created_at', -1).limit(limit)
    notifications = list(cursor)
    
    # Convert ObjectId to string for JSON serialization
    for notification in notifications:
        notification['_id'] = str(notification['_id'])
        if isinstance(notification.get('user_id'), ObjectId):
            notification['user_id'] = str(notification.get('user_id'))
    
    logger.info(f"[NOTIF_ROUTE] User {user_id_str} (role: {user_role}) - Found {len(notifications)} notifications")
    return notifications

def get_filtered_unread_count(user_id, user_role, company_id=None):
    """Get unread count filtered by user role"""
    db = get_db()
    user_id_str = str(user_id)
    
    # Base query for unread notifications
    query = {'is_read': False}
    
    if user_role == 'employee':
        # Employees only count their personal unread notifications
        query['user_id'] = user_id_str
        
    elif user_role == 'supervisor':
        # Supervisors count personal + company-wide supervisor notifications
        if company_id:
            query['$or'] = [
                # Personal unread notifications
                {'user_id': user_id_str},
                # Company-wide unread notifications for supervisors
                {'company_id': company_id, 'target_roles': {'$in': ['supervisor', 'admin']}}
            ]
        else:
            # Fallback: only personal unread notifications
            query['user_id'] = user_id_str
            
    elif user_role == 'admin':
        # Admins count personal + all admin-level unread notifications
        query['$or'] = [
            # Personal unread notifications
            {'user_id': user_id_str},
            # Company-wide unread notifications for admins/supervisors
            {'target_roles': {'$in': ['admin', 'supervisor']}},
            # All unread notifications
            {}
        ]
    
    count = db.notifications.count_documents(query)
    logger.info(f"[NOTIF_ROUTE] User {user_id_str} (role: {user_role}) - Unread count: {count}")
    return count

@notif_bp.route('', methods=['GET'])
@jwt_required()
def get_user_notifications():
    """Get notifications for current user based on their role"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if not current_user:
            logger.error(f"[NOTIF_ROUTE] User not found: {current_user_id}")
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get limit from query params, default to 20
        limit = request.args.get('limit', 20, type=int)
        
        # Get user info
        user_role = current_user.get('role', 'employee')
        company_id = current_user.get('company_id')
        
        # Get filtered notifications
        notifications = get_filtered_notifications(
            user_id=current_user_id,
            user_role=user_role,
            company_id=company_id,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'notifications': notifications,
            'count': len(notifications)
        }), 200
        
    except Exception as e:
        logger.error(f"Get notifications error: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'An error occurred'}), 500

@notif_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_user_unread_count():
    """Get unread notification count for current user based on role"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if not current_user:
            logger.error(f"[NOTIF_ROUTE] User not found for unread count: {current_user_id}")
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get user info
        user_role = current_user.get('role', 'employee')
        company_id = current_user.get('company_id')
        
        # Get filtered unread count
        count = get_filtered_unread_count(
            user_id=current_user_id,
            user_role=user_role,
            company_id=company_id
        )
        
        return jsonify({
            'success': True,
            'count': count
        }), 200
        
    except Exception as e:
        logger.error(f"Get unread count error: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'An error occurred'}), 500

@notif_bp.route('/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user_role = current_user.get('role', 'employee')
        
        # Check if notification exists
        db = get_db()
        notification = db.notifications.find_one({"_id": ObjectId(notification_id)})
        
        if not notification:
            return jsonify({'success': False, 'error': 'Notification not found'}), 404
        
        # Check authorization based on role
        notification_user_id = notification.get('user_id')
        
        if user_role == 'employee':
            # Employees can only mark their own notifications as read
            if str(notification_user_id) != current_user_id:
                return jsonify({'success': False, 'error': 'Unauthorized'}), 403
                
        elif user_role == 'supervisor':
            # Supervisors can mark:
            # 1. Their own notifications
            # 2. Company-wide supervisor notifications in their company
            if str(notification_user_id) != current_user_id:
                notification_company = notification.get('company_id')
                user_company = current_user.get('company_id')
                target_roles = notification.get('target_roles', [])
                
                # Check if it's a company-wide supervisor notification in their company
                if (notification_company != user_company or 
                    'supervisor' not in target_roles):
                    return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Admins can mark any notification as read (no additional check needed)
        
        success = mark_as_read(notification_id)
        
        if success:
            logger.info(f"[NOTIF_ROUTE] Marked notification {notification_id} as read by user {current_user_id}")
            return jsonify({'success': True, 'message': 'Notification marked as read'}), 200
        else:
            logger.warning(f"[NOTIF_ROUTE] Failed to mark notification {notification_id} as read")
            return jsonify({'success': False, 'error': 'Failed to mark as read'}), 500
            
    except Exception as e:
        logger.error(f"Mark as read error: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'An error occurred'}), 500

@notif_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for current user based on role"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user_role = current_user.get('role', 'employee')
        company_id = current_user.get('company_id')
        
        db = get_db()
        user_id_str = str(current_user_id)
        
        # Build query based on role
        query = {'is_read': False}
        
        if user_role == 'employee':
            # Employees only mark their personal notifications as read
            query['user_id'] = user_id_str
            
        elif user_role == 'supervisor':
            # Supervisors mark personal + company-wide supervisor notifications
            if company_id:
                query['$or'] = [
                    {'user_id': user_id_str},
                    {'company_id': company_id, 'target_roles': {'$in': ['supervisor', 'admin']}}
                ]
            else:
                query['user_id'] = user_id_str
                
        elif user_role == 'admin':
            # Admins mark personal + all admin-level notifications
            query['$or'] = [
                {'user_id': user_id_str},
                {'target_roles': {'$in': ['admin', 'supervisor']}},
                {}
            ]
        
        # Update all matching notifications
        result = db.notifications.update_many(
            query,
            {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
        )
        
        count = result.modified_count
        
        logger.info(f"[NOTIF_ROUTE] Marked {count} notifications as read for user {user_id_str} (role: {user_role})")
        
        return jsonify({
            'success': True,
            'message': f'{count} notifications marked as read'
        }), 200
        
    except Exception as e:
        logger.error(f"Mark all as read error: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'An error occurred'}), 500

@notif_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_user_notification(notification_id):
    """Delete a notification"""
    try:
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user_role = current_user.get('role', 'employee')
        
        # Check if notification exists
        db = get_db()
        notification = db.notifications.find_one({"_id": ObjectId(notification_id)})
        
        if not notification:
            return jsonify({'success': False, 'error': 'Notification not found'}), 404
        
        # Check authorization based on role
        notification_user_id = notification.get('user_id')
        
        if user_role == 'employee':
            # Employees can only delete their own notifications
            if str(notification_user_id) != current_user_id:
                return jsonify({'success': False, 'error': 'Unauthorized'}), 403
                
        elif user_role == 'supervisor':
            # Supervisors can delete:
            # 1. Their own notifications
            # 2. Company-wide supervisor notifications in their company
            if str(notification_user_id) != current_user_id:
                notification_company = notification.get('company_id')
                user_company = current_user.get('company_id')
                target_roles = notification.get('target_roles', [])
                
                # Check if it's a company-wide supervisor notification in their company
                if (notification_company != user_company or 
                    'supervisor' not in target_roles):
                    return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Admins can delete any notification (no additional check needed)
        
        success = delete_notification(notification_id)
        
        if success:
            logger.info(f"[NOTIF_ROUTE] Deleted notification {notification_id} by user {current_user_id}")
            return jsonify({'success': True, 'message': 'Notification deleted'}), 200
        else:
            logger.warning(f"[NOTIF_ROUTE] Failed to delete notification {notification_id}")
            return jsonify({'success': False, 'error': 'Failed to delete notification'}), 500
            
    except Exception as e:
        logger.error(f"Delete notification error: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'An error occurred'}), 500