"""
Update existing synced users to add missing fields
"""
from pymongo import MongoClient
from datetime import datetime, UTC
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/hr_management_db')

def main():
    print("Updating synced users with missing fields...")
    
    client = MongoClient(MONGO_URI)
    db = client.get_default_database()
    
    # Find users synced from device (have device_user_id but missing department/position)
    users = db.users.find({'device_user_id': {'$exists': True}})
    
    updated = 0
    for user in users:
        update_fields = {}
        
        # Add department if missing
        if 'department' not in user or not user.get('department'):
            update_fields['department'] = 'Unassigned'
        
        # Add position if missing
        if 'position' not in user or not user.get('position'):
            update_fields['position'] = 'Employee'
        
        if update_fields:
            db.users.update_one(
                {'_id': user['_id']},
                {'$set': update_fields}
            )
            updated += 1
            print(f"✓ Updated {user.get('first_name')} {user.get('last_name')}")
    
    print(f"\n✅ Updated {updated} users")
    client.close()

if __name__ == '__main__':
    main()
