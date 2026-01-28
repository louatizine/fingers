"""
MongoDB Database Connection and Initialization
"""
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure
import logging

logger = logging.getLogger(__name__)

db = None
mongo_client = None

def init_db(app):
    """Initialize MongoDB connection and create indexes"""
    global db, mongo_client
    
    try:
        mongo_client = MongoClient(app.config['MONGO_URI'])
        # Test connection
        mongo_client.admin.command('ping')
        
        db = mongo_client.get_default_database()
        
        logger.info("MongoDB connected successfully")
        
        # Create indexes for better performance
        create_indexes()
        
        # Create default admin if not exists
        create_default_admin()
        
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

def create_indexes():
    """Create database indexes for performance"""
    try:
        # Users collection
        db.users.create_index([("email", ASCENDING)], unique=True)
        db.users.create_index([("employee_id", ASCENDING)], unique=True)
        db.users.create_index([("company_id", ASCENDING)])
        db.users.create_index([("role", ASCENDING)])
        
        # Leaves collection
        db.leaves.create_index([("user_id", ASCENDING)])
        db.leaves.create_index([("status", ASCENDING)])
        db.leaves.create_index([("start_date", DESCENDING)])
        
        # Salary advances collection
        db.salary_advances.create_index([("user_id", ASCENDING)])
        db.salary_advances.create_index([("status", ASCENDING)])
        db.salary_advances.create_index([("request_date", DESCENDING)])
        
        # Projects collection
        db.projects.create_index([("company_id", ASCENDING)])
        
        # Companies collection
        db.companies.create_index([("name", ASCENDING)])
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

def create_default_admin():
    """Create default admin user if not exists"""
    from werkzeug.security import generate_password_hash
    from datetime import datetime
    
    try:
        admin_email = "admin@hrmanagement.com"
        existing_admin = db.users.find_one({"email": admin_email})
        
        if not existing_admin:
            # Create default company first
            default_company = db.companies.find_one({"name": "Default Company"})
            if not default_company:
                company_data = {
                    "name": "Default Company",
                    "annual_leave_days": 20,
                    "sick_leave_days": 10,
                    "unpaid_leave_days": 5,
                    "created_at": datetime.utcnow()
                }
                company_result = db.companies.insert_one(company_data)
                company_id = str(company_result.inserted_id)
            else:
                company_id = str(default_company['_id'])
            
            admin_data = {
                "employee_id": "EMP001",
                "email": admin_email,
                "password": generate_password_hash("admin123"),
                "first_name": "System",
                "last_name": "Administrator",
                "role": "supervisor",
                "company_id": company_id,
                "department": "Administration",
                "position": "System Administrator",
                "phone": "",
                "is_active": True,
                "leave_balance": {
                    "annual": 20,
                    "sick": 10,
                    "unpaid": 5
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            db.users.insert_one(admin_data)
            logger.info(f"Default admin created: {admin_email} / admin123")
    except Exception as e:
        logger.error(f"Error creating default admin: {e}")

def get_db():
    """Get database instance"""
    return db
