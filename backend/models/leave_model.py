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

def get_all_leaves(filters=None, limit=None):
    """
    Get leave requests with optional filters.
    Pass limit to avoid loading the full collection (e.g. dashboard recent lists).
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
        
        cursor = db.leaves.find(query).sort('created_at', -1)
        if limit:
            cursor = cursor.limit(int(limit))
        leaves = list(cursor)
        for leave in leaves:
            leave['_id'] = str(leave['_id'])
        return leaves
    except Exception as e:
        logger.error(f"Error getting all leaves: {e}")
        return []


def count_leaves(filters=None):
    """Count leave documents matching filters without loading them."""
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
        return db.leaves.count_documents(query)
    except Exception as e:
        logger.error(f"Error counting leaves: {e}")
        return 0

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
    Get leave statistics via aggregation (no full-collection load).
    """
    empty = {
        'total': 0,
        'pending': 0,
        'approved': 0,
        'rejected': 0,
        'total_days': 0,
    }
    try:
        db = get_db()
        match = {}
        if user_id:
            match['user_id'] = user_id
        if company_id:
            match['company_id'] = company_id

        pipeline = []
        if match:
            pipeline.append({'$match': match})
        pipeline.extend([
            {
                '$group': {
                    '_id': '$status',
                    'count': {'$sum': 1},
                    'days': {
                        '$sum': {
                            '$cond': [
                                {'$eq': ['$status', 'approved']},
                                {'$ifNull': ['$days', 0]},
                                0,
                            ]
                        }
                    },
                }
            }
        ])
        stats = dict(empty)
        for row in db.leaves.aggregate(pipeline):
            status = row.get('_id') or 'unknown'
            count = int(row.get('count') or 0)
            stats['total'] += count
            if status in ('pending', 'approved', 'rejected'):
                stats[status] = count
            if status == 'approved':
                stats['total_days'] = float(row.get('days') or 0)
        return stats
    except Exception as e:
        logger.error(f"Error getting leave statistics: {e}")
        return empty
