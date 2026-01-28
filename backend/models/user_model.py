"""
User Model and Operations
"""
from database import get_db
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from datetime import datetime

def create_user(user_data):
    """Create a new user"""
    db = get_db()
    
    # Auto-generate employee_id if not provided
    if 'employee_id' not in user_data or not user_data['employee_id']:
        # Find the next available employee ID by checking existing IDs
        existing_ids = [doc['employee_id'] for doc in db.users.find({}, {'employee_id': 1}) if 'employee_id' in doc]
        
        # Extract numbers from existing IDs and find the max
        existing_numbers = []
        for emp_id in existing_ids:
            if emp_id.startswith('EMP') and emp_id[3:].isdigit():
                existing_numbers.append(int(emp_id[3:]))
        
        # Get next available number
        next_number = max(existing_numbers) + 1 if existing_numbers else 1
        user_data['employee_id'] = f"EMP{next_number:04d}"
    
    # Hash password
    if 'password' in user_data:
        user_data['password'] = generate_password_hash(user_data['password'])
    
    user_data['created_at'] = datetime.utcnow()
    user_data['updated_at'] = datetime.utcnow()
    user_data['is_active'] = user_data.get('is_active', True)
    
    # Set default leave balance based on company settings
    if 'leave_balance' not in user_data and 'company_id' in user_data:
        company = db.companies.find_one({"_id": ObjectId(user_data['company_id'])})
        if company:
            user_data['leave_balance'] = {
                'annual': company.get('annual_leave_days', 20),
                'sick': company.get('sick_leave_days', 10),
                'unpaid': company.get('unpaid_leave_days', 5)
            }
    
    result = db.users.insert_one(user_data)
    return str(result.inserted_id)

def find_user_by_email(email):
    """Find user by email"""
    db = get_db()
    user = db.users.find_one({"email": email})
    if user:
        user['_id'] = str(user['_id'])
    return user

def find_user_by_employee_id(employee_id):
    """Find user by employee ID"""
    db = get_db()
    user = db.users.find_one({"employee_id": employee_id})
    if user:
        user['_id'] = str(user['_id'])
    return user

def find_user_by_id(user_id):
    """Find user by ID"""
    db = get_db()
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            user['_id'] = str(user['_id'])
        return user
    except:
        return None

def update_user(user_id, update_data):
    """Update user data"""
    db = get_db()
    
    # Hash password if provided
    if 'password' in update_data:
        update_data['password'] = generate_password_hash(update_data['password'])
    
    update_data['updated_at'] = datetime.utcnow()
    
    result = db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    return result.modified_count > 0

def delete_user(user_id):
    """Soft delete user (deactivate)"""
    db = get_db()
    result = db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

def activate_user(user_id):
    """Activate user"""
    db = get_db()
    result = db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

def get_all_users(filters=None):
    """Get all users with optional filters"""
    db = get_db()
    query = filters or {}
    
    users = list(db.users.find(query))
    for user in users:
        user['_id'] = str(user['_id'])
        user.pop('password', None)  # Remove password from response
    
    return users

def verify_password(user, password):
    """Verify user password"""
    return check_password_hash(user['password'], password)

def update_leave_balance(user_id, leave_type, days):
    """Update user leave balance (legacy - for sick/unpaid leaves)"""
    db = get_db()
    result = db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$inc": {f"leave_balance.{leave_type}": days},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    return result.modified_count > 0

def update_vacation_usage(user_id, days):
    """Update vacation_used and recalculate vacation_balance for annual leaves"""
    db = get_db()
    from models.settings_model import get_settings
    
    # Get user and settings
    user = db.users.find_one({"_id": ObjectId(user_id)})
    settings = get_settings()
    
    if not user or not settings:
        return False
    
    # Calculate new vacation_used
    current_used = user.get('vacation_used', 0)
    new_used = current_used + days
    
    # Calculate vacation_earned
    if user.get('hire_date'):
        hire_date = user['hire_date']
        if isinstance(hire_date, str):
            hire_date = datetime.fromisoformat(hire_date.replace('Z', '+00:00'))
        
        today = datetime.utcnow()
        months_diff = (today.year - hire_date.year) * 12 + (today.month - hire_date.month)
        months_after_probation = max(0, months_diff - settings.get('probation_period_months', 3))
        vacation_earned = months_after_probation * settings.get('monthly_vacation_days', 2.5)
    else:
        vacation_earned = 0
    
    # Calculate new balance
    vacation_balance = vacation_earned - new_used
    
    # Update user record
    result = db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "vacation_used": new_used,
                "vacation_earned": vacation_earned,
                "vacation_balance": vacation_balance,
                "updated_at": datetime.utcnow()
            }
        }
    )
    return result.modified_count > 0

def get_vacation_balance(user_id):
    """Get current vacation balance for a user"""
    db = get_db()
    from models.settings_model import get_settings
    
    user = db.users.find_one({"_id": ObjectId(user_id)})
    settings = get_settings()
    
    if not user or not settings:
        return 0
    
    # Check if we have pre-calculated balance
    if 'vacation_balance' in user:
        return user['vacation_balance']
    
    # Calculate on-the-fly if not available
    if not user.get('hire_date'):
        return 0
    
    hire_date = user['hire_date']
    if isinstance(hire_date, str):
        hire_date = datetime.fromisoformat(hire_date.replace('Z', '+00:00'))
    
    today = datetime.utcnow()
    months_diff = (today.year - hire_date.year) * 12 + (today.month - hire_date.month)
    months_after_probation = max(0, months_diff - settings.get('probation_period_months', 3))
    vacation_earned = months_after_probation * settings.get('monthly_vacation_days', 2.5)
    
    # Get approved annual leaves
    used_vacation = list(db.leaves.find({
        'user_id': str(user['_id']),
        'status': 'approved',
        'leave_type': 'annual'  # Use normalized type
    }))
    vacation_used = sum([leave.get('days', 0) for leave in used_vacation])
    
    return vacation_earned - vacation_used
