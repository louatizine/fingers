"""
Salary Advance Model and Operations
"""
from database import get_db
from bson.objectid import ObjectId
from datetime import datetime

def create_salary_advance_request(advance_data):
    """Create a new salary advance request"""
    db = get_db()
    
    advance_data['status'] = 'pending'
    advance_data['created_at'] = datetime.utcnow()
    advance_data['updated_at'] = datetime.utcnow()
    
    result = db.salary_advances.insert_one(advance_data)
    return str(result.inserted_id)

def get_salary_advance_by_id(advance_id):
    """Get salary advance request by ID"""
    db = get_db()
    try:
        advance = db.salary_advances.find_one({"_id": ObjectId(advance_id)})
        if advance:
            advance['_id'] = str(advance['_id'])
        return advance
    except:
        return None

def get_salary_advances_by_user(user_id, filters=None):
    """Get all salary advance requests for a user"""
    db = get_db()
    query = {"user_id": user_id}
    
    if filters:
        query.update(filters)
    
    advances = list(db.salary_advances.find(query).sort("created_at", -1))
    for advance in advances:
        advance['_id'] = str(advance['_id'])
    
    return advances

def get_all_salary_advances(filters=None):
    """Get all salary advance requests with optional filters"""
    db = get_db()
    query = filters or {}
    
    advances = list(db.salary_advances.find(query).sort("created_at", -1))
    for advance in advances:
        advance['_id'] = str(advance['_id'])
    
    return advances

def update_salary_advance_status(advance_id, status, reviewed_by, review_comment=None):
    """Update salary advance request status"""
    db = get_db()
    
    update_data = {
        "status": status,
        "reviewed_by": reviewed_by,
        "reviewed_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    if review_comment:
        update_data['review_comment'] = review_comment
    
    result = db.salary_advances.update_one(
        {"_id": ObjectId(advance_id)},
        {"$set": update_data}
    )
    
    return result.modified_count > 0

def delete_salary_advance(advance_id):
    """Delete salary advance request"""
    db = get_db()
    result = db.salary_advances.delete_one({"_id": ObjectId(advance_id)})
    return result.deleted_count > 0

def get_salary_advance_statistics(user_id=None, company_id=None):
    """Get salary advance statistics"""
    db = get_db()
    
    pipeline = []
    
    # Match stage
    match_stage = {}
    if user_id:
        match_stage['user_id'] = user_id
    
    if company_id:
        # Get users from company
        users = db.users.find({"company_id": company_id}, {"_id": 1})
        user_ids = [str(u['_id']) for u in users]
        match_stage['user_id'] = {"$in": user_ids}
    
    if match_stage:
        pipeline.append({"$match": match_stage})
    
    # Group stage
    pipeline.append({
        "$group": {
            "_id": "$status",
            "count": {"$sum": 1},
            "total_amount": {"$sum": "$amount"}
        }
    })
    
    stats = list(db.salary_advances.aggregate(pipeline))
    
    result = {
        "pending": 0,
        "approved": 0,
        "rejected": 0,
        "total_amount_approved": 0
    }
    
    for stat in stats:
        status = stat['_id']
        result[status] = stat['count']
        if status == 'approved':
            result['total_amount_approved'] = stat['total_amount']
    
    return result
