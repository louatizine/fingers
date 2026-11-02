"""
Salary Advance Model - Database operations for salary advance management
"""
from database import get_db
from bson.objectid import ObjectId
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
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

def get_all_salary_advances(filters=None, limit=None):
    """
    Get salary advance requests with optional filters.
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
        
        cursor = db.salary_advances.find(query).sort('created_at', -1)
        if limit:
            cursor = cursor.limit(int(limit))
        advances = list(cursor)
        for advance in advances:
            advance['_id'] = str(advance['_id'])
        return advances
    except Exception as e:
        logger.error(f"Error getting all salary advances: {e}")
        return []


def count_salary_advances(filters=None):
    """Count salary advance documents matching filters without loading them."""
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
        return db.salary_advances.count_documents(query)
    except Exception as e:
        logger.error(f"Error counting salary advances: {e}")
        return 0

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

def build_repayment_schedule(amount, request_date=None):
    """Build equal monthly installments from the request month through December."""
    try:
        numeric_amount = Decimal(str(amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        if request_date:
            if isinstance(request_date, datetime):
                start = request_date
            else:
                start = datetime.fromisoformat(str(request_date).replace('Z', '+00:00'))
        else:
            start = datetime.utcnow()
        months = 13 - start.month
        installment = (numeric_amount / months).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        schedule = []
        for offset in range(months):
            month_number = start.month + offset
            month_amount = numeric_amount - installment * (months - 1) if offset == months - 1 else installment
            schedule.append({
                'month': f'{start.year}-{month_number:02d}',
                'amount': float(month_amount),
                'paid': False,
                'paid_at': None,
                'paid_by': None,
            })
        return schedule
    except (ValueError, TypeError, ArithmeticError):
        return []

def update_repayment_payment(advance_id, month, paid, user_id):
    """Toggle one repayment month and record who confirmed it."""
    try:
        db = get_db()
        advance = db.salary_advances.find_one({'_id': ObjectId(advance_id)})
        if not advance:
            return None
        schedule = advance.get('repayment_schedule', [])
        target = next((entry for entry in schedule if entry.get('month') == month), None)
        if not target:
            return None
        target['paid'] = bool(paid)
        target['paid_at'] = datetime.utcnow().isoformat() if paid else None
        target['paid_by'] = user_id if paid else None
        db.salary_advances.update_one(
            {'_id': ObjectId(advance_id)},
            {'$set': {'repayment_schedule': schedule}},
        )
        return target
    except Exception as e:
        logger.error(f"Error updating repayment payment: {e}")
        return None

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
    Get salary advance statistics via aggregation (no full-collection load).
    """
    empty = {
        'total': 0,
        'pending': 0,
        'approved': 0,
        'rejected': 0,
        'total_amount': 0,
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
                '$addFields': {
                    'amountNum': {
                        '$convert': {
                            'input': '$amount',
                            'to': 'double',
                            'onError': 0,
                            'onNull': 0,
                        }
                    }
                }
            },
            {
                '$group': {
                    '_id': '$status',
                    'count': {'$sum': 1},
                    'amount': {
                        '$sum': {
                            '$cond': [
                                {'$eq': ['$status', 'approved']},
                                '$amountNum',
                                0,
                            ]
                        }
                    },
                }
            }
        ])
        stats = dict(empty)
        for row in db.salary_advances.aggregate(pipeline):
            status = row.get('_id') or 'unknown'
            count = int(row.get('count') or 0)
            stats['total'] += count
            if status in ('pending', 'approved', 'rejected'):
                stats[status] = count
            if status == 'approved':
                stats['total_amount'] = float(row.get('amount') or 0)
        
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
