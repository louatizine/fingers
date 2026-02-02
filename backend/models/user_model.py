# File: data_model.py
"""
Data Model - Consolidated database operations
"""
from database import get_db
from bson.objectid import ObjectId
from datetime import datetime
import logging
import bcrypt

logger = logging.getLogger(__name__)

# Authentication helper functions
def find_user_by_email(email):
    """
    Find a user by email address
    """
    try:
        db = get_db()
        user = db.users.find_one({'email': email})
        if user:
            user['_id'] = str(user['_id'])
        return user
    except Exception as e:
        logger.error(f"Error finding user by email: {e}")
        return None

def find_user_by_id(user_id):
    """
    Find a user by ID
    """
    try:
        db = get_db()
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if user:
            user['_id'] = str(user['_id'])
        return user
    except Exception as e:
        logger.error(f"Error finding user by ID: {e}")
        return None

def verify_password(user, password):
    """
    Verify user password using bcrypt or Werkzeug scrypt
    """
    try:
        if not user or 'password' not in user:
            return False
        
        stored_password = user['password']
        
        # Handle different password hash formats
        if isinstance(stored_password, str):
            # Check if it's a bcrypt hash
            if stored_password.startswith('$2b$') or stored_password.startswith('$2a$'):
                return bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8'))
            # Check if it's a Werkzeug scrypt hash
            elif stored_password.startswith('scrypt:'):
                from werkzeug.security import check_password_hash
                return check_password_hash(stored_password, password)
            else:
                # Plain text comparison (not recommended for production)
                logger.warning("Using plain text password comparison - please hash passwords!")
                return stored_password == password
        elif isinstance(stored_password, bytes):
            return bcrypt.checkpw(password.encode('utf-8'), stored_password)
        
        return False
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return False

def find_user_by_employee_id(employee_id):
    """
    Find a user by employee ID
    """
    try:
        db = get_db()
        user = db.users.find_one({'employee_id': employee_id})
        if user:
            user['_id'] = str(user['_id'])
        return user
    except Exception as e:
        logger.error(f"Error finding user by employee_id: {e}")
        return None

def create_user(user_data):
    """
    Create a new user in the database
    """
    try:
        db = get_db()
        
        # Check if email already exists
        if db.users.find_one({'email': user_data.get('email')}):
            return {'success': False, 'error': 'Email already exists'}
        
        # Check if employee_id already exists
        if user_data.get('employee_id') and db.users.find_one({'employee_id': user_data.get('employee_id')}):
            return {'success': False, 'error': 'Employee ID already exists'}
        
        # Hash password if provided
        if 'password' in user_data:
            if not user_data['password'].startswith('$2b$') and not user_data['password'].startswith('$2a$'):
                hashed = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt())
                user_data['password'] = hashed.decode('utf-8')
        
        # Set defaults
        user_data.setdefault('is_active', True)
        user_data.setdefault('role', 'employee')
        user_data.setdefault('created_at', datetime.utcnow())
        
        result = db.users.insert_one(user_data)
        user_data['_id'] = str(result.inserted_id)
        
        return {'success': True, 'user': user_data, 'user_id': str(result.inserted_id)}
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return {'success': False, 'error': str(e)}

def update_user(user_id, update_data):
    """
    Update user information
    """
    try:
        db = get_db()
        
        # Hash password if being updated
        if 'password' in update_data:
            if not update_data['password'].startswith('$2b$') and not update_data['password'].startswith('$2a$'):
                hashed = bcrypt.hashpw(update_data['password'].encode('utf-8'), bcrypt.gensalt())
                update_data['password'] = hashed.decode('utf-8')
        
        update_data['updated_at'] = datetime.utcnow()
        
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            return {'success': True, 'message': 'User updated successfully'}
        else:
            return {'success': False, 'error': 'User not found'}
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        return {'success': False, 'error': str(e)}

def delete_user(user_id):
    """
    Delete a user (soft delete by setting is_active to False)
    """
    try:
        db = get_db()
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'is_active': False, 'deleted_at': datetime.utcnow()}}
        )
        
        if result.modified_count > 0:
            return {'success': True, 'message': 'User deleted successfully'}
        else:
            return {'success': False, 'error': 'User not found'}
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        return {'success': False, 'error': str(e)}

def activate_user(user_id):
    """
    Activate a user account
    """
    try:
        db = get_db()
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'is_active': True, 'activated_at': datetime.utcnow()}}
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error activating user: {e}")
        return False

def update_leave_balance(user_id, leave_type, days):
    """
    Update user's leave balance
    """
    try:
        db = get_db()
        field_name = f'leave_balances.{leave_type}'
        
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$inc': {field_name: days}}
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error updating leave balance: {e}")
        return False

def get_vacation_balance(user_id):
    """
    Get user's vacation balance
    """
    try:
        db = get_db()
        user = db.users.find_one({'_id': ObjectId(user_id)})
        
        if user:
            return user.get('leave_balances', {}).get('vacation', 0)
        return 0
    except Exception as e:
        logger.error(f"Error getting vacation balance: {e}")
        return 0

def update_vacation_usage(user_id, days):
    """
    Update vacation usage (deduct from balance)
    """
    try:
        return update_leave_balance(user_id, 'vacation', -days)
    except Exception as e:
        logger.error(f"Error updating vacation usage: {e}")
        return False

def get_all_database_data():
    """
    Get all data from all collections in a structured format
    This is for debugging/admin purposes
    """
    db = get_db()
    
    try:
        # Get all collection names
        collections = db.list_collection_names()
        
        data = {}
        for collection in collections:
            try:
                # Get all documents from collection
                cursor = db[collection].find()
                docs = list(cursor)
                
                # Convert ObjectId to string for JSON serialization
                for doc in docs:
                    if '_id' in doc and isinstance(doc['_id'], ObjectId):
                        doc['_id'] = str(doc['_id'])
                    
                    # Convert any nested ObjectId fields
                    convert_objectids_to_strings(doc)
                
                data[collection] = {
                    'count': len(docs),
                    'documents': docs
                }
                
            except Exception as e:
                logger.error(f"Error reading collection {collection}: {e}")
                data[collection] = {
                    'count': 0,
                    'documents': [],
                    'error': str(e)
                }
        
        return {
            'success': True,
            'timestamp': datetime.utcnow().isoformat(),
            'data': data
        }
        
    except Exception as e:
        logger.error(f"Get all database data error: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }

def convert_objectids_to_strings(obj):
    """Recursively convert ObjectId fields to strings"""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, ObjectId):
                obj[key] = str(value)
            elif isinstance(value, dict):
                convert_objectids_to_strings(value)
            elif isinstance(value, list):
                for item in value:
                    convert_objectids_to_strings(item)
    elif isinstance(obj, list):
        for item in obj:
            convert_objectids_to_strings(item)

def get_employees_dashboard_data(filters=None):
    """
    Get structured data for employees dashboard
    Matches what the frontend needs
    """
    db = get_db()
    
    try:
        # Parse filters
        query = {}
        if filters:
            # Apply status filter
            if filters.get('status') and filters['status'] != 'all':
                query['is_active'] = filters['status'] == 'active'
            
            # Apply department filter
            if filters.get('department') and filters['department'] != 'all':
                query['department'] = filters['department']
            
            # Apply company filter
            if filters.get('company_id') and filters['company_id'] != 'all':
                query['company_id'] = filters['company_id']
        
        # Default: only get employees (not admins)
        if 'role' not in query:
            query['role'] = {'$in': ['employee', 'supervisor']}
        
        # Get employees
        employees_cursor = db.users.find(query)
        employees = list(employees_cursor)
        
        # Apply search filter if provided
        if filters and filters.get('search'):
            search_term = filters['search'].lower()
            employees = [
                emp for emp in employees
                if (search_term in emp.get('first_name', '').lower() or
                    search_term in emp.get('last_name', '').lower() or
                    search_term in emp.get('email', '').lower() or
                    search_term in emp.get('employee_id', '').lower() or
                    search_term in emp.get('position', '').lower())
            ]
        
        # Apply sorting
        sort_field = 'last_name'
        sort_direction = 1  # Ascending
        
        if filters and filters.get('sort'):
            sort_config = filters['sort']
            if sort_config.get('key'):
                sort_field = sort_config['key']
                sort_direction = -1 if sort_config.get('direction') == 'desc' else 1
        
        employees.sort(key=lambda x: x.get(sort_field, ''), reverse=(sort_direction == -1))
        
        # Convert ObjectId to string and remove sensitive data
        processed_employees = []
        for emp in employees:
            emp['_id'] = str(emp['_id'])
            
            # Remove password for security
            if 'password' in emp:
                del emp['password']
            
            # Ensure all required fields exist
            emp.setdefault('employee_id', '')
            emp.setdefault('first_name', '')
            emp.setdefault('last_name', '')
            emp.setdefault('email', '')
            emp.setdefault('department', '')
            emp.setdefault('position', '')
            emp.setdefault('phone', '')
            emp.setdefault('is_active', True)
            emp.setdefault('hire_date', '')
            emp.setdefault('profile_picture', '')
            emp.setdefault('role', 'employee')
            
            processed_employees.append(emp)
        
        # Get companies
        companies_cursor = db.companies.find()
        companies = list(companies_cursor)
        for company in companies:
            company['_id'] = str(company['_id'])
        
        # Get unique departments
        departments = db.users.distinct('department', query)
        departments = [dept for dept in departments if dept]  # Remove empty strings
        
        # Calculate statistics
        total_employees = len(processed_employees)
        active_employees = len([emp for emp in processed_employees if emp.get('is_active', True)])
        unique_departments = len(departments)
        
        # Calculate average experience (if hire_date exists)
        experience_days = []
        for emp in processed_employees:
            if emp.get('hire_date'):
                try:
                    if isinstance(emp['hire_date'], str):
                        hire_date = datetime.fromisoformat(emp['hire_date'].replace('Z', '+00:00'))
                    else:
                        hire_date = emp['hire_date']
                    
                    experience_days.append((datetime.utcnow() - hire_date).days)
                except:
                    continue
        
        avg_experience = round(sum(experience_days) / len(experience_days) / 365, 1) if experience_days else 0
        
        # Prepare response
        response = {
            'success': True,
            'employees': processed_employees,
            'companies': companies,
            'departments': departments,
            'stats': {
                'total': total_employees,
                'active': active_employees,
                'departments': unique_departments,
                'avgExperience': avg_experience
            },
            'pagination': {
                'total': total_employees,
                'page': filters.get('page', 1) if filters else 1,
                'limit': filters.get('limit', 50) if filters else 50
            }
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Get employees dashboard data error: {e}")
        return {
            'success': False,
            'error': str(e),
            'employees': [],
            'companies': [],
            'departments': [],
            'stats': {
                'total': 0,
                'active': 0,
                'departments': 0,
                'avgExperience': 0
            }
        }

def get_user_complete_profile(user_id):
    """
    Get complete user profile with all related data
    """
    db = get_db()
    
    try:
        # Get user
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return {'success': False, 'error': 'User not found'}
        
        user['_id'] = str(user['_id'])
        
        # Remove password
        if 'password' in user:
            del user['password']
        
        # Get company info
        company = None
        if 'company_id' in user:
            company = db.companies.find_one({'_id': ObjectId(user['company_id'])})
            if company:
                company['_id'] = str(company['_id'])
        
        # Get leave history
        leaves = list(db.leaves.find({'user_id': user_id}))
        for leave in leaves:
            leave['_id'] = str(leave['_id'])
        
        # Get attendance records (last 30 days)
        thirty_days_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        thirty_days_ago = thirty_days_ago.replace(day=thirty_days_ago.day - 30)
        
        attendance = list(db.attendance.find({
            'user_id': user_id,
            'date': {'$gte': thirty_days_ago}
        }).sort('date', -1).limit(30))
        
        for record in attendance:
            record['_id'] = str(record['_id'])
        
        # Get documents
        documents = list(db.documents.find({'user_id': user_id}))
        for doc in documents:
            doc['_id'] = str(doc['_id'])
        
        return {
            'success': True,
            'user': user,
            'company': company,
            'leaves': leaves,
            'attendance': attendance,
            'documents': documents
        }
        
    except Exception as e:
        logger.error(f"Get user complete profile error: {e}")
        return {'success': False, 'error': str(e)}

def get_all_users(filters=None):
    """
    Retrieve all users from the database with optional filtering.
    """
    db = get_db()
    query = {}

    # Apply filters if provided (e.g., company_id)
    if filters:
        if 'company_id' in filters:
            query['company_id'] = filters['company_id']
        if 'role' in filters:
            query['role'] = filters['role']

    try:
        # Find all users matching the query
        users_cursor = db.users.find(query)
        users = list(users_cursor)

        # Process users for JSON serialization
        for user in users:
            user['_id'] = str(user['_id'])
            # Remove sensitive information
            user.pop('password', None)
            
            # Ensure essential fields exist for the frontend table
            user.setdefault('is_active', True)
            user.setdefault('first_name', '')
            user.setdefault('last_name', '')
            user.setdefault('email', '')
            user.setdefault('department', '')
            user.setdefault('position', '')

        return users
    except Exception as e:
        print(f"Error fetching users: {e}")
        return []

def export_all_data(format='json'):
    """
    Export all data from database
    """
    try:
        data = get_all_database_data()
        
        if format == 'csv':
            # Convert to CSV (simplified version)
            csv_data = {}
            for collection_name, collection_data in data['data'].items():
                if collection_data['documents']:
                    # Get headers
                    headers = set()
                    for doc in collection_data['documents']:
                        headers.update(doc.keys())
                    
                    # Create CSV rows
                    rows = [','.join(headers)]
                    for doc in collection_data['documents']:
                        row = []
                        for header in headers:
                            value = doc.get(header, '')
                            # Convert to string and escape commas
                            if isinstance(value, (list, dict)):
                                value = str(value).replace(',', ';')
                            row.append(str(value).replace(',', ';'))
                        rows.append(','.join(row))
                    
                    csv_data[collection_name] = '\n'.join(rows)
            
            return {
                'success': True,
                'format': 'csv',
                'data': csv_data,
                'timestamp': datetime.utcnow().isoformat()
            }
        
        else:  # JSON
            return data
        
    except Exception as e:
        logger.error(f"Export all data error: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }