"""
Leave Model and Operations
"""
from database import get_db
from bson.objectid import ObjectId
from datetime import datetime

def create_leave_request(leave_data):
    """Create a new leave request"""
    db = get_db()
    
    leave_data['status'] = 'pending'
    leave_data['created_at'] = datetime.utcnow()
    leave_data['updated_at'] = datetime.utcnow()
    
    result = db.leaves.insert_one(leave_data)
    return str(result.inserted_id)

def get_leave_by_id(leave_id):
    """Get leave request by ID"""
    db = get_db()
    try:
        leave = db.leaves.find_one({"_id": ObjectId(leave_id)})
        if leave:
            leave['_id'] = str(leave['_id'])
        return leave
    except:
        return None

def get_leaves_by_user(user_id, filters=None):
    """Get all leave requests for a user"""
    db = get_db()
    query = {"user_id": user_id}
    
    if filters:
        query.update(filters)
    
    leaves = list(db.leaves.find(query).sort("created_at", -1))
    for leave in leaves:
        leave['_id'] = str(leave['_id'])
    
    return leaves

def get_all_leaves(filters=None):
    """Get all leave requests with optional filters"""
    db = get_db()
    query = filters or {}
    
    leaves = list(db.leaves.find(query).sort("created_at", -1))
    for leave in leaves:
        leave['_id'] = str(leave['_id'])
    
    return leaves

def update_leave_status(leave_id, status, reviewed_by, review_comment=None):
    """Update leave request status"""
    db = get_db()
    
    update_data = {
        "status": status,
        "reviewed_by": reviewed_by,
        "reviewed_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    if review_comment:
        update_data['review_comment'] = review_comment
    
    result = db.leaves.update_one(
        {"_id": ObjectId(leave_id)},
        {"$set": update_data}
    )
    
    return result.modified_count > 0

def delete_leave(leave_id):
    """Delete leave request"""
    db = get_db()
    result = db.leaves.delete_one({"_id": ObjectId(leave_id)})
    return result.deleted_count > 0

def get_leave_statistics(user_id=None, company_id=None):
    """Get leave statistics"""
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
            "total_days": {"$sum": "$days"}
        }
    })
    
    stats = list(db.leaves.aggregate(pipeline))
    
    result = {
        "pending": 0,
        "approved": 0,
        "rejected": 0,
        "total_days_taken": 0
    }
    
    for stat in stats:
        status = stat['_id']
        result[status] = stat['count']
        if status == 'approved':
            result['total_days_taken'] = stat['total_days']
    
    return result
