"""
Create Admin User Script
Run this to create a default admin user for testing
"""
from dotenv import load_dotenv
load_dotenv()

from pymongo import MongoClient
import bcrypt
from datetime import datetime
import os

def create_admin_user():
    """Create a default admin user"""
    # Connect to MongoDB
    mongo_uri = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/hr_management_db'
    client = MongoClient(mongo_uri)
    db = client.get_database()
    
    # Check if admin already exists
    existing_admin = db.users.find_one({'email': 'admin@dynamix.com'})
    
    if existing_admin:
        print("Admin user already exists!")
        print(f"Email: admin@dynamix.com")
        print("Updating password to: admin123")
        
        # Update password
        hashed_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
        db.users.update_one(
            {'email': 'admin@dynamix.com'},
            {'$set': {'password': hashed_password.decode('utf-8')}}
        )
        print("Password updated successfully!")
    else:
        print("Creating new admin user...")
        
        # Hash password
        hashed_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
        
        # Create admin user
        admin_user = {
            'email': 'admin@dynamix.com',
            'password': hashed_password.decode('utf-8'),
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'admin',
            'is_active': True,
            'employee_id': 'ADMIN001',
            'phone': '',
            'department': 'Administration',
            'position': 'System Administrator',
            'created_at': datetime.utcnow()
        }
        
        result = db.users.insert_one(admin_user)
        print(f"Admin user created successfully! ID: {result.inserted_id}")
    
    print("\n=== Login Credentials ===")
    print("Email: admin@dynamix.com")
    print("Password: admin123")
    print("========================\n")

if __name__ == '__main__':
    create_admin_user()
