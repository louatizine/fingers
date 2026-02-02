"""
Notification Model and Operations
"""
from database import get_db
from bson.objectid import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def create_notification(notification_data):
    """Create a new notification"""
    db = get_db()
    notification_data['is_read'] = False
    notification_data['created_at'] = datetime.utcnow()
    
    # 🔥 Ensure user_id is stored as string consistently
    if 'user_id' in notification_data and isinstance(notification_data['user_id'], ObjectId):
        notification_data['user_id'] = str(notification_data['user_id'])
    
    logger.info(f"[NOTIF_MODEL] Creating notification with user_id: {notification_data.get('user_id')}")
    result = db.notifications.insert_one(notification_data)
    logger.info(f"[NOTIF_MODEL] Created notification with _id: {result.inserted_id}")
    return str(result.inserted_id)

def get_notifications_by_user(user_id, limit=50):
    """Get notifications for a user"""
    db = get_db()
    
    # 🔥 CRITICAL FIX: Convert user_id to string for consistent querying
    user_id_str = str(user_id)
    logger.info(f"[NOTIF_MODEL] Fetching notifications for user_id (as string): {user_id_str}")
    
    # Query with string user_id
    cursor = db.notifications.find({"user_id": user_id_str})
    
    # Sort by newest first
    notifications = list(cursor.sort("created_at", -1).limit(limit))
    
    # Convert ObjectId to string for JSON serialization
    for notification in notifications:
        notification['_id'] = str(notification['_id'])
        # Ensure user_id is also string (should already be)
        if isinstance(notification.get('user_id'), ObjectId):
            notification['user_id'] = str(notification['user_id'])
    
    logger.info(f"[NOTIF_MODEL] Found {len(notifications)} notifications for user: {user_id_str}")
    
    # Debug: log first few notifications
    if notifications:
        for i, n in enumerate(notifications[:3]):
            logger.info(f"[NOTIF_MODEL] Notification {i+1}: id={n.get('_id')}, title={n.get('title')}, is_read={n.get('is_read')}")
    
    return notifications

def get_unread_count(user_id):
    """Get count of unread notifications for a user"""
    db = get_db()
    
    # 🔥 FIX: Use string user_id
    user_id_str = str(user_id)
    
    count = db.notifications.count_documents({
        "user_id": user_id_str,
        "is_read": False
    })
    
    logger.info(f"[NOTIF_MODEL] Unread count for user {user_id_str}: {count}")
    return count

def mark_as_read(notification_id):
    """Mark a notification as read"""
    db = get_db()
    
    result = db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
    )
    
    return result.modified_count > 0

def mark_all_as_read(user_id):
    """Mark all notifications as read for a user"""
    db = get_db()
    
    # 🔥 FIX: Use string user_id
    user_id_str = str(user_id)
    
    result = db.notifications.update_many(
        {"user_id": user_id_str, "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
    )
    
    logger.info(f"[NOTIF_MODEL] Marked {result.modified_count} notifications as read for user {user_id_str}")
    return result.modified_count

def delete_notification(notification_id):
    """Delete a notification"""
    db = get_db()
    result = db.notifications.delete_one({"_id": ObjectId(notification_id)})
    return result.deleted_count > 0