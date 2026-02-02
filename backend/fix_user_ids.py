"""
Fix existing users without employee_id or biometric_id
Run this once to update existing users in the database
"""
from database import init_db, get_db
from flask import Flask
from config import Config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_existing_users():
    """Add employee_id and biometric_id to users that don't have them"""
    # Initialize Flask app and database
    app = Flask(__name__)
    app.config.from_object(Config)
    init_db(app)
    
    db = get_db()
    
    # Find users without employee_id
    users_without_id = list(db.users.find({'employee_id': {'$exists': False}}))
    
    logger.info(f"Found {len(users_without_id)} users without employee_id")
    
    # Find the highest existing employee number
    last_user = db.users.find_one(
        {'employee_id': {'$regex': '^EMP'}},
        sort=[('employee_id', -1)]
    )
    
    if last_user and last_user.get('employee_id'):
        try:
            start_num = int(last_user['employee_id'].replace('EMP', '')) + 1
        except:
            start_num = 1
    else:
        start_num = 1
    
    # Update each user
    for i, user in enumerate(users_without_id):
        emp_num = start_num + i
        employee_id = f"EMP{emp_num:04d}"
        biometric_id = emp_num
        
        db.users.update_one(
            {'_id': user['_id']},
            {
                '$set': {
                    'employee_id': employee_id,
                    'biometric_id': biometric_id,
                    'has_fingerprint': user.get('has_fingerprint', False),
                    'fingerprint_status': user.get('fingerprint_status', 'PENDING')
                }
            }
        )
        
        logger.info(f"Updated user {user.get('email')} -> {employee_id} (biometric_id: {biometric_id})")
    
    logger.info(f"✅ Fixed {len(users_without_id)} users")

if __name__ == '__main__':
    fix_existing_users()
