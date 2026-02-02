"""
Salary Advance Model - Database operations for salary advance management
"""
from database import get_db
from bson.objectid import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def create_salary_advance_request(advance_data):
    """
    Create a new salary advance request
    """
    try:
        db = get_db()
        advance_data['created_at'] = datetime.utcnow()
        advance_data.setdefault('status', 'pending')
        
        result = db.salary_advances.insert_one(advance_data)
        
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error creating salary advance request: {e}")
        return None

def get_salary_advance_by_id(advance_id):
    """
    Get salary advance request by ID
    """
    try:
        db = get_db()
        advance = db.salary_advances.find_one({'_id': ObjectId(advance_id)})
        if advance:
            advance['_id'] = str(advance['_id'])
        return advance
    except Exception as e:
        logger.error(f"Error getting salary advance by ID: {e}")
        return None

def get_salary_advances_by_user(user_id):
    """
    Get all salary advance requests for a specific user
    """
    try:
        db = get_db()
        advances = list(db.salary_advances.find({'user_id': user_id}).sort('created_at', -1))
        for advance in advances:
            advance['_id'] = str(advance['_id'])
        return advances
    except Exception as e:
        logger.error(f"Error getting salary advances by user: {e}")
        return []

def get_all_salary_advances(filters=None):
    """
    Get all salary advance requests with optional filters
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
        
        advances = list(db.salary_advances.find(query).sort('created_at', -1))
        for advance in advances:
            advance['_id'] = str(advance['_id'])
        return advances
    except Exception as e:
        logger.error(f"Error getting all salary advances: {e}")
        return []

def update_salary_advance_status(advance_id, status, reviewed_by=None, review_notes=None):
    """
    Update salary advance request status
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
        
        result = db.salary_advances.update_one(
            {'_id': ObjectId(advance_id)},
            {'$set': update_data}
        )
        
        return result.modified_count > 0 or result.matched_count > 0
    except Exception as e:
        logger.error(f"Error updating salary advance status: {e}")
        return False

def delete_salary_advance(advance_id):
    """
    Delete a salary advance request
    """
    try:
        db = get_db()
        result = db.salary_advances.delete_one({'_id': ObjectId(advance_id)})
        
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Error deleting salary advance: {e}")
        return False

def get_salary_advance_statistics(user_id=None, company_id=None):
    """
    Get salary advance statistics
    """
    try:
        db = get_db()
        query = {}
        
        if user_id:
            query['user_id'] = user_id
        if company_id:
            query['company_id'] = company_id
        
        advances = list(db.salary_advances.find(query))
        
        # Calculate total amount, ensuring all amounts are numbers
        total_amount = 0
        for a in advances:
            if a.get('status') == 'approved':
                amount = a.get('amount', 0)
                # Convert to float if it's a string
                if isinstance(amount, str):
                    try:
                        total_amount += float(amount)
                    except (ValueError, TypeError):
                        pass
                else:
                    total_amount += float(amount) if amount else 0
        
        stats = {
            'total': len(advances),
            'pending': len([a for a in advances if a.get('status') == 'pending']),
            'approved': len([a for a in advances if a.get('status') == 'approved']),
            'rejected': len([a for a in advances if a.get('status') == 'rejected']),
            'total_amount': total_amount
        }
        
        return stats
    except Exception as e:
        logger.error(f"Error getting salary advance statistics: {e}")
        return {
            'total': 0,
            'pending': 0,
            'approved': 0,
            'rejected': 0,
            'total_amount': 0
        }
