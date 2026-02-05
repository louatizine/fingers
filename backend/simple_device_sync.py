"""
Simple Device to Database Sync
Just get data from device and store it in MongoDB
"""

from zk_device_manager import ZKDeviceManager
from pymongo import MongoClient
from datetime import datetime, timezone, UTC
from dotenv import load_dotenv
import os
import sys

# Load environment
load_dotenv()

# Configuration
DEVICE_IP = "192.168.100.5"
DEVICE_PORT = 4370
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/hr_management_db')
DEFAULT_COMPANY_ID = None  # Set to a company ObjectId if you want to assign synced users to a specific company

def main():
    print("=" * 60)
    print("  Device to Database Sync")
    print("=" * 60)
    
    # Connect to MongoDB
    print(f"\n1. Connecting to MongoDB...")
    client = MongoClient(MONGO_URI)
    db = client.get_default_database()
    print(f"   ✓ Connected to database: {db.name}")
    
    # Connect to Device
    print(f"\n2. Connecting to device at {DEVICE_IP}:{DEVICE_PORT}...")
    device = ZKDeviceManager()
    if not device.connect(DEVICE_IP, DEVICE_PORT):
        print("   ✗ Failed to connect to device!")
        return
    print("   ✓ Connected to device")
    
    try:
        # Get device users
        print("\n3. Getting users from device...")
        device_users = device.get_users()
        print(f"   ✓ Found {len(device_users)} users")
        
        # Get attendance logs
        print("\n4. Getting attendance logs from device...")
        device_logs = device.get_attendance_logs()
        print(f"   ✓ Found {len(device_logs)} attendance records")
        
        # Sync users to database
        print("\n5. Syncing users to database...")
        new_users = 0
        updated_users = 0
        
        for user in device_users:
            # Check if user exists by biometric_id (device UID)
            existing = db.users.find_one({'biometric_id': user['uid']})
            
            if existing:
                # Update existing user
                db.users.update_one(
                    {'biometric_id': user['uid']},
                    {'$set': {
                        'has_fingerprint': True,
                        'fingerprint_status': 'ENROLLED',
                        'last_device_sync': datetime.now(UTC)
                    }}
                )
                updated_users += 1
            else:
                # Create new user
                name_parts = user['name'].split('.') if '.' in user['name'] else user['name'].split(' ')
                first_name = name_parts[1] if len(name_parts) > 1 else name_parts[0]
                last_name = name_parts[0] if len(name_parts) > 1 else ''
                
                new_user = {
                    'employee_id': f"EMP{int(user['user_id']):04d}" if user['user_id'].isdigit() else f"EMP{user['user_id']}",
                    'biometric_id': user['uid'],
                    'first_name': first_name.strip(),
                    'last_name': last_name.strip(),
                    'email': f"{first_name.lower()}.{last_name.lower()}@company.com".replace(' ', ''),
                    'role': 'employee',
                    'department': 'Unassigned',
                    'position': 'Employee',
                    'has_fingerprint': True,
                    'fingerprint_status': 'ENROLLED',
                    'device_user_id': user['user_id'],
                    'is_active': True,
                    'created_at': datetime.now(UTC),
                    'last_device_sync': datetime.now(UTC)
                }
                
                # Add company_id if configured
                if DEFAULT_COMPANY_ID:
                    new_user['company_id'] = DEFAULT_COMPANY_ID
                
                if user.get('card') and user['card'] != 0:
                    new_user['card_number'] = str(user['card'])
                
                db.users.insert_one(new_user)
                new_users += 1
        
        print(f"   ✓ Created {new_users} new users")
        print(f"   ✓ Updated {updated_users} existing users")
        
        # Sync attendance logs to database
        print("\n6. Syncing attendance logs to database...")
        print(f"   Processing {len(device_logs)} records...")
        
        bulk_operations = []
        skipped_logs = 0
        
        for idx, log in enumerate(device_logs, 1):
            # Progress indicator
            if idx % 1000 == 0:
                print(f"   Progress: {idx}/{len(device_logs)} processed...", end='\r')
            # Parse timestamp
            timestamp = datetime.fromisoformat(log['timestamp'])
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
            
            # Skip future timestamps (corrupt data from device)
            if timestamp > datetime.now(UTC):
                skipped_logs += 1
                continue
            
            # Find user by device_user_id
            user = db.users.find_one({'device_user_id': log['user_id']})
            if not user:
                # Try by biometric_id if user_id is numeric
                if log['user_id'].isdigit():
                    user = db.users.find_one({'biometric_id': int(log['user_id'])})
            
            if not user:
                skipped_logs += 1
                continue
            
            # Map punch type to event type
            punch_to_event = {
                0: 'check_in',
                1: 'check_out',
                2: 'check_out',
                3: 'check_in',
                4: 'check_in',
                5: 'check_out'
            }
            event_type = punch_to_event.get(log['punch'], 'check_in')
            
            # Add to bulk operations
            bulk_operations.append({
                'employee_id': user['employee_id'],
                'event_type': event_type,
                'device_id': 'ZKTeco K80',
                'match_score': 100,
                'notes': f"Synced from device - {log['punch_type']}",
                'timestamp': timestamp,
                'created_at': datetime.now(UTC)
            })
        
        # Insert all attendance records at once
        new_logs = 0
        if bulk_operations:
            print(f"\n   Inserting {len(bulk_operations)} records to database...")
            try:
                result = db.attendance.insert_many(bulk_operations, ordered=False)
                new_logs = len(result.inserted_ids)
            except Exception as e:
                # Some may fail due to duplicates, count successes
                if hasattr(e, 'details') and 'writeErrors' in e.details:
                    new_logs = len(bulk_operations) - len(e.details['writeErrors'])
                else:
                    new_logs = 0
        
        print(f"   ✓ Synced {new_logs} new attendance records")
        print(f"   ⊘ Skipped {skipped_logs} records (future timestamps or no matching user)")
        
        print("\n" + "=" * 60)
        print("  ✅ SYNC COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f"\n  Users:      {new_users} new, {updated_users} updated")
        print(f"  Attendance: {new_logs} new, {skipped_logs} skipped")
        print()
        
    finally:
        device.disconnect()
        client.close()


if __name__ == '__main__':
    main()
