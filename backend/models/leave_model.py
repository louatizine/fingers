"""
Leave Model - Database operations for leave management
"""
from database import get_db
from bson.objectid import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def create_leave_request(leave_data):
    """
    Create a new leave request
    """
    try:
        db = get_db()
        leave_data['created_at'] = datetime.utcnow()
        leave_data.setdefault('status', 'pending')
        
        result = db.leaves.insert_one(leave_data)
        
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error creating leave request: {e}")
        return None

def get_leave_by_id(leave_id):
    """
    Get leave request by ID
    """
    try:
        db = get_db()
        leave = db.leaves.find_one({'_id': ObjectId(leave_id)})
        if leave:
            leave['_id'] = str(leave['_id'])
        return leave
    except Exception as e:
        logger.error(f"Error getting leave by ID: {e}")
        return None

def get_leaves_by_user(user_id):
    """
    Get all leave requests for a specific user
    """
    try:
        db = get_db()
        leaves = list(db.leaves.find({'user_id': user_id}).sort('created_at', -1))
        for leave in leaves:
            leave['_id'] = str(leave['_id'])
        return leaves
    except Exception as e:
        logger.error(f"Error getting leaves by user: {e}")
        return []

def get_all_leaves(filters=None):
    """
    Get all leave requests with optional filters
    """
    try:
        db = get_db()
        query = {}
        
        if filters:
            if 'company_id' in filters:
                query['company_id'] = filters['company_id']
            if 'status' in filters:
                query['status'] = filters['status']
            if 'user_id' in filters:
                query['user_id'] = filters['user_id']
        
        leaves = list(db.leaves.find(query).sort('created_at', -1))
        for leave in leaves:
            leave['_id'] = str(leave['_id'])
        return leaves
    except Exception as e:
        logger.error(f"Error getting all leaves: {e}")
        return []

def update_leave_status(leave_id, status, reviewed_by=None, review_notes=None):
    """
    Update leave request status
    """
    try:
        db = get_db()
        update_data = {
            'status': status,
            'reviewed_at': datetime.utcnow()
        }
        
        if reviewed_by:
            update_data['reviewed_by'] = reviewed_by
        if review_notes:
            update_data['review_notes'] = review_notes
        
        result = db.leaves.update_one(
            {'_id': ObjectId(leave_id)},
            {'$set': update_data}
        )
        
        return result.modified_count > 0 or result.matched_count > 0
    except Exception as e:
        logger.error(f"Error updating leave status: {e}")
        return False

def delete_leave(leave_id):
    """
    Delete a leave request
    """
    try:
        db = get_db()
        result = db.leaves.delete_one({'_id': ObjectId(leave_id)})
        
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Error deleting leave: {e}")
        return False

def get_leave_statistics(user_id=None, company_id=None):
    """
    Get leave statistics
    """
    try:
        db = get_db()
        query = {}
        
        if user_id:
            query['user_id'] = user_id
        if company_id:
            query['company_id'] = company_id
        
        leaves = list(db.leaves.find(query))
        
        stats = {
            'total': len(leaves),
            'pending': len([l for l in leaves if l.get('status') == 'pending']),
            'approved': len([l for l in leaves if l.get('status') == 'approved']),
            'rejected': len([l for l in leaves if l.get('status') == 'rejected']),
            'total_days': sum(l.get('days', 0) for l in leaves if l.get('status') == 'approved')
        }
        
        return stats
    except Exception as e:
        logger.error(f"Error getting leave statistics: {e}")
        return {
            'total': 0,
            'pending': 0,
            'approved': 0,
            'rejected': 0,
            'total_days': 0
        }
