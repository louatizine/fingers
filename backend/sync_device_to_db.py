"""
ZKTeco Device to Database Sync Script
======================================
Synchronizes users and attendance logs from ZKTeco device to MongoDB database.

This script:
1. Connects to the ZKTeco device
2. Retrieves users and attendance logs
3. Maps device data to database schema
4. Syncs data to MongoDB (avoiding duplicates)
5. Provides detailed sync reports
"""

import sys
import logging
from datetime import datetime, timezone
from typing import Dict, List, Tuple
from zk_device_manager import ZKDeviceManager
from pymongo import MongoClient
from models.user_model import create_user, find_user_by_employee_id
from models.attendance_model import create_attendance_log, get_last_attendance
from bson.objectid import ObjectId
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)


class DeviceToDBSyncer:
    """
    Synchronizes ZKTeco device data with MongoDB database.
    
    Handles user and attendance data mapping and deduplication.
    """
    
    def __init__(self, device_ip: str, device_port: int = 4370, device_name: str = "ZKTeco Device"):
        """
        Initialize the syncer.
        
        Args:
            device_ip: IP address of the ZKTeco device
            device_port: Port of the device (default: 4370)
            device_name: Friendly name for the device
        """
        self.device_ip = device_ip
        self.device_port = device_port
        self.device_name = device_name
        self.device_manager = ZKDeviceManager()
        self.db = None
        
        # Sync statistics
        self.stats = {
            'users': {
                'total_on_device': 0,
                'new_created': 0,
                'already_exists': 0,
                'updated': 0,
                'failed': 0
            },
            'attendance': {
                'total_on_device': 0,
                'new_synced': 0,
                'duplicates_skipped': 0,
                'failed': 0
            }
        }
    
    def connect_to_database(self) -> bool:
        """Connect to MongoDB database."""
        try:
            # Get MongoDB URI from environment or use default
            mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/hr_management_db')
            
            # Create MongoDB client
            client = MongoClient(mongo_uri)
            
            # Test connection
            client.admin.command('ping')
            
            # Get database
            self.db = client.get_default_database()
            
            logger.info(f"Connected to MongoDB database: {self.db.name}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            return False
    
    def connect_to_device(self) -> bool:
        """Connect to ZKTeco device."""
        logger.info(f"Connecting to device at {self.device_ip}:{self.device_port}...")
        return self.device_manager.connect(self.device_ip, self.device_port)
    
    def disconnect(self):
        """Disconnect from device."""
        self.device_manager.disconnect()
    
    def sync_users(self, auto_create: bool = True, update_existing: bool = False) -> bool:
        """
        Sync users from device to database.
        
        Args:
            auto_create: Automatically create new users not in database
            update_existing: Update existing user information from device
            
        Returns:
            bool: True if sync completed successfully
        """
        logger.info("=" * 80)
        logger.info("SYNCING USERS FROM DEVICE TO DATABASE")
        logger.info("=" * 80)
        
        # Get users from device
        device_users = self.device_manager.get_users()
        self.stats['users']['total_on_device'] = len(device_users)
        
        if not device_users:
            logger.warning("No users found on device")
            return False
        
        logger.info(f"Retrieved {len(device_users)} users from device")
        
        # Process each user
        for device_user in device_users:
            try:
                self._sync_single_user(device_user, auto_create, update_existing)
            except Exception as e:
                logger.error(f"Error syncing user {device_user.get('user_id')}: {e}")
                self.stats['users']['failed'] += 1
        
        # Print summary
        self._print_user_sync_summary()
        return True
    
    def _sync_single_user(self, device_user: Dict, auto_create: bool, update_existing: bool):
        """
        Sync a single user from device to database.
        
        Maps device user data to database schema:
        - device user_id -> employee_id (e.g., "2" -> "EMP0002" or use as biometric_id)
        - device uid -> biometric_id (unique ID in device)
        - device name -> first_name/last_name
        - device card -> card_number
        """
        device_user_id = device_user.get('user_id', '')
        device_uid = device_user.get('uid', 0)
        device_name = device_user.get('name', 'Unknown')
        
        # Try to find user by biometric_id (uid from device)
        existing_user = self.db.users.find_one({'biometric_id': device_uid})
        
        # If not found, try by employee_id if it matches device user_id
        if not existing_user:
            # Try formats: user_id directly, EMP{user_id}, EMP{user_id:04d}
            possible_employee_ids = [
                device_user_id,
                f"EMP{device_user_id}",
                f"EMP{int(device_user_id):04d}" if device_user_id.isdigit() else None
            ]
            
            for emp_id in possible_employee_ids:
                if emp_id:
                    existing_user = find_user_by_employee_id(emp_id)
                    if existing_user:
                        break
        
        if existing_user:
            # User exists in database
            if update_existing:
                self._update_user_from_device(existing_user, device_user)
                self.stats['users']['updated'] += 1
                logger.info(f"✓ Updated user: {device_name} (biometric_id: {device_uid})")
            else:
                self.stats['users']['already_exists'] += 1
                logger.info(f"- User already exists: {device_name} (biometric_id: {device_uid})")
        else:
            # User doesn't exist
            if auto_create:
                success = self._create_user_from_device(device_user)
                if success:
                    self.stats['users']['new_created'] += 1
                    logger.info(f"✓ Created new user: {device_name} (biometric_id: {device_uid})")
                else:
                    self.stats['users']['failed'] += 1
                    logger.error(f"✗ Failed to create user: {device_name}")
            else:
                logger.warning(f"- User not in database (auto-create disabled): {device_name}")
                self.stats['users']['failed'] += 1
    
    def _create_user_from_device(self, device_user: Dict) -> bool:
        """
        Create a new user in database from device data.
        
        Maps ZKTeco user fields to database user schema.
        """
        try:
            # Parse name into first and last name
            full_name = device_user.get('name', 'Unknown User')
            name_parts = full_name.split('.', 1) if '.' in full_name else full_name.split(' ', 1)
            
            if len(name_parts) >= 2:
                last_name = name_parts[0].strip()
                first_name = name_parts[1].strip()
            else:
                first_name = name_parts[0].strip()
                last_name = ''
            
            # Prepare user data for database
            user_data = {
                'employee_id': f"EMP{int(device_user['user_id']):04d}" if device_user['user_id'].isdigit() else f"EMP{device_user['user_id']}",
                'biometric_id': device_user['uid'],  # Use device UID as biometric_id
                'first_name': first_name,
                'last_name': last_name,
                'email': f"{first_name.lower()}.{last_name.lower()}@company.com".replace(' ', ''),
                'role': 'employee',
                'has_fingerprint': True,  # User is from fingerprint device
                'fingerprint_status': 'ENROLLED',
                'device_user_id': device_user['user_id'],  # Store original device user_id
                'is_active': True,
                'created_at': datetime.utcnow(),
                'synced_from_device': True,
                'last_device_sync': datetime.utcnow()
            }
            
            # Add card number if available
            if device_user.get('card') and device_user['card'] != 0:
                user_data['card_number'] = str(device_user['card'])
            
            # Add privilege/role mapping
            privilege_to_role = {
                0: 'employee',
                1: 'employee',
                2: 'manager',
                6: 'admin',
                14: 'admin'  # Special admin privilege
            }
            user_data['role'] = privilege_to_role.get(device_user.get('privilege', 0), 'employee')
            
            # Create user
            result = create_user(user_data)
            
            if result.get('success'):
                return True
            else:
                logger.error(f"Failed to create user: {result.get('error')}")
                return False
                
        except Exception as e:
            logger.error(f"Error creating user from device data: {e}")
            return False
    
    def _update_user_from_device(self, existing_user: Dict, device_user: Dict):
        """
        Update existing user with latest device data.
        """
        try:
            user_id = existing_user['_id'] if isinstance(existing_user['_id'], ObjectId) else ObjectId(existing_user['_id'])
            
            update_data = {
                'has_fingerprint': True,
                'fingerprint_status': 'ENROLLED',
                'last_device_sync': datetime.utcnow(),
                'device_user_id': device_user['user_id']
            }
            
            # Update card number if changed
            if device_user.get('card') and device_user['card'] != 0:
                update_data['card_number'] = str(device_user['card'])
            
            self.db.users.update_one(
                {'_id': user_id},
                {'$set': update_data}
            )
            
        except Exception as e:
            logger.error(f"Error updating user: {e}")
    
    def sync_attendance(self, limit: int = None, clear_after_sync: bool = False) -> bool:
        """
        Sync attendance logs from device to database.
        
        Args:
            limit: Maximum number of logs to sync (None = all)
            clear_after_sync: Clear device logs after successful sync (use with caution!)
            
        Returns:
            bool: True if sync completed successfully
        """
        logger.info("=" * 80)
        logger.info("SYNCING ATTENDANCE LOGS FROM DEVICE TO DATABASE")
        logger.info("=" * 80)
        
        # Get attendance logs from device
        device_logs = self.device_manager.get_attendance_logs()
        self.stats['attendance']['total_on_device'] = len(device_logs)
        
        if not device_logs:
            logger.warning("No attendance logs found on device")
            return False
        
        logger.info(f"Retrieved {len(device_logs)} attendance logs from device")
        
        # Apply limit if specified
        if limit:
            device_logs = device_logs[:limit]
            logger.info(f"Limiting sync to {limit} logs")
        
        # Sort by timestamp (oldest first for chronological insertion)
        device_logs.sort(key=lambda x: x['timestamp'])
        
        # Process each log
        for device_log in device_logs:
            try:
                self._sync_single_attendance(device_log)
            except Exception as e:
                logger.error(f"Error syncing attendance log: {e}")
                self.stats['attendance']['failed'] += 1
        
        # Print summary
        self._print_attendance_sync_summary()
        
        # Clear device logs if requested
        if clear_after_sync and self.stats['attendance']['new_synced'] > 0:
            confirmation = input("\n⚠️  Are you sure you want to CLEAR device logs? (yes/no): ").strip().lower()
            if confirmation == 'yes':
                if self.device_manager.clear_attendance_logs():
                    logger.info("✓ Device attendance logs cleared successfully")
                else:
                    logger.error("✗ Failed to clear device logs")
        
        return True
    
    def _sync_single_attendance(self, device_log: Dict):
        """
        Sync a single attendance log from device to database.
        
        Maps device log to database schema and avoids duplicates.
        """
        device_user_id = device_log.get('user_id', '')
        timestamp_str = device_log.get('timestamp', '')
        punch_type = device_log.get('punch', 0)
        
        # Parse timestamp
        try:
            timestamp = datetime.fromisoformat(timestamp_str)
            # Ensure UTC timezone
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
        except:
            logger.error(f"Invalid timestamp format: {timestamp_str}")
            self.stats['attendance']['failed'] += 1
            return
        
        # Find corresponding user in database
        user = self._find_user_by_device_id(device_user_id)
        
        if not user:
            logger.warning(f"User not found for device_user_id: {device_user_id} - skipping attendance")
            self.stats['attendance']['failed'] += 1
            return
        
        employee_id = user.get('employee_id')
        
        # Check for duplicate (same user, same timestamp within 1 minute)
        existing_log = self.db.attendance.find_one({
            'employee_id': employee_id,
            'timestamp': {
                '$gte': timestamp.replace(second=0, microsecond=0),
                '$lt': timestamp.replace(second=59, microsecond=999999)
            }
        })
        
        if existing_log:
            self.stats['attendance']['duplicates_skipped'] += 1
            return
        
        # Map punch type to event type
        punch_to_event = {
            0: 'check_in',    # Check-In
            1: 'check_out',   # Check-Out
            2: 'check_out',   # Break-Out (treated as check-out)
            3: 'check_in',    # Break-In (treated as check-in)
            4: 'check_in',    # OT-In (treated as check-in)
            5: 'check_out'    # OT-Out (treated as check-out)
        }
        
        event_type = punch_to_event.get(punch_type, 'check_in')
        
        # Create attendance log in database
        try:
            create_attendance_log(
                employee_id=employee_id,
                event_type=event_type,
                device_id=self.device_name,
                match_score=100,  # Device attendance is 100% match
                notes=f"Synced from device - Punch type: {device_log.get('punch_type')}",
                timestamp=timestamp
            )
            
            self.stats['attendance']['new_synced'] += 1
            
        except Exception as e:
            logger.error(f"Failed to create attendance log: {e}")
            self.stats['attendance']['failed'] += 1
    
    def _find_user_by_device_id(self, device_user_id: str) -> Dict:
        """
        Find user in database by device user_id.
        
        Tries multiple strategies:
        1. Match by device_user_id field
        2. Match by employee_id variants
        3. Match by biometric_id
        """
        # Strategy 1: Direct device_user_id match
        user = self.db.users.find_one({'device_user_id': device_user_id})
        if user:
            return user
        
        # Strategy 2: Employee ID variants
        possible_employee_ids = [
            device_user_id,
            f"EMP{device_user_id}",
            f"EMP{int(device_user_id):04d}" if device_user_id.isdigit() else None
        ]
        
        for emp_id in possible_employee_ids:
            if emp_id:
                user = find_user_by_employee_id(emp_id)
                if user:
                    # Update with device_user_id for future lookups
                    user_id = user['_id'] if isinstance(user['_id'], ObjectId) else ObjectId(user['_id'])
                    self.db.users.update_one(
                        {'_id': user_id},
                        {'$set': {'device_user_id': device_user_id}}
                    )
                    return user
        
        # Strategy 3: Match by user_id as integer to biometric_id
        if device_user_id.isdigit():
            user = self.db.users.find_one({'biometric_id': int(device_user_id)})
            if user:
                return user
        
        return None
    
    def _print_user_sync_summary(self):
        """Print user sync statistics."""
        print("\n" + "=" * 80)
        print("  USER SYNC SUMMARY")
        print("=" * 80)
        print(f"  Total users on device:     {self.stats['users']['total_on_device']}")
        print(f"  New users created:         {self.stats['users']['new_created']}")
        print(f"  Already exists:            {self.stats['users']['already_exists']}")
        print(f"  Updated:                   {self.stats['users']['updated']}")
        print(f"  Failed:                    {self.stats['users']['failed']}")
        print("=" * 80 + "\n")
    
    def _print_attendance_sync_summary(self):
        """Print attendance sync statistics."""
        print("\n" + "=" * 80)
        print("  ATTENDANCE SYNC SUMMARY")
        print("=" * 80)
        print(f"  Total logs on device:      {self.stats['attendance']['total_on_device']}")
        print(f"  New logs synced:           {self.stats['attendance']['new_synced']}")
        print(f"  Duplicates skipped:        {self.stats['attendance']['duplicates_skipped']}")
        print(f"  Failed:                    {self.stats['attendance']['failed']}")
        print("=" * 80 + "\n")
    
    def full_sync(self, auto_create_users: bool = True, clear_device_after: bool = False) -> bool:
        """
        Perform a complete sync of both users and attendance.
        
        Args:
            auto_create_users: Automatically create users found on device
            clear_device_after: Clear device logs after successful sync
            
        Returns:
            bool: True if sync completed successfully
        """
        logger.info("\n" + "=" * 80)
        logger.info("STARTING FULL DEVICE SYNC")
        logger.info("=" * 80 + "\n")
        
        # Sync users first
        if not self.sync_users(auto_create=auto_create_users, update_existing=True):
            logger.error("User sync failed")
            return False
        
        # Then sync attendance
        if not self.sync_attendance(clear_after_sync=clear_device_after):
            logger.error("Attendance sync failed")
            return False
        
        logger.info("\n✅ FULL SYNC COMPLETED SUCCESSFULLY!\n")
        return True


def main():
    """Main function to run the sync."""
    print("=" * 80)
    print("  ZKTeco Device to Database Sync Tool")
    print("=" * 80)
    print()
    
    # Get device configuration
    device_ip = input("Enter device IP address (or press Enter for 192.168.100.5): ").strip()
    if not device_ip:
        device_ip = "192.168.100.5"
    
    port_input = input("Enter device port (or press Enter for 4370): ").strip()
    port = int(port_input) if port_input else 4370
    
    device_name = input("Enter device name (or press Enter for 'ZKTeco K80'): ").strip()
    if not device_name:
        device_name = "ZKTeco K80"
    
    print()
    
    # Initialize syncer
    syncer = DeviceToDBSyncer(device_ip, port, device_name)
    
    try:
        # Connect to database
        if not syncer.connect_to_database():
            print("❌ Failed to connect to database")
            return 1
        
        # Connect to device
        if not syncer.connect_to_device():
            print("❌ Failed to connect to device")
            return 1
        
        print()
        
        # Ask what to sync
        print("What would you like to sync?")
        print("  1) Users only")
        print("  2) Attendance only")
        print("  3) Both (Full sync)")
        choice = input("\nEnter choice (1-3): ").strip()
        
        print()
        
        if choice == '1':
            syncer.sync_users(auto_create=True, update_existing=True)
        elif choice == '2':
            syncer.sync_attendance()
        elif choice == '3':
            syncer.full_sync(auto_create_users=True, clear_device_after=False)
        else:
            print("Invalid choice")
            return 1
        
        return 0
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        return 1
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return 1
        
    finally:
        syncer.disconnect()


if __name__ == '__main__':
    sys.exit(main())
