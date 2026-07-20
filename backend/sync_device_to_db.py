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
from typing import Dict, List
from zoneinfo import ZoneInfo
from zk_device_manager import ZKDeviceManager
from services.zk_attendance_utils import (
    employee_id_candidates,
    find_user_for_device_user_id,
    normalize_device_timestamp,
    pick_best_device_user_match,
)
from services.daily_attendance_aggregator import (
    AttendanceEvent,
    aggregate_events_to_daily_summaries,
)
from services.daily_attendance_service import upsert_daily_summaries
from pymongo import MongoClient
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
    
    def __init__(self, device_ip: str, device_port: int = 4370, device_name: str = "ZKTeco Device", min_sync_date: str = None):
        """
        Initialize the syncer.
        
        Args:
            device_ip: IP address of the ZKTeco device
            device_port: Port of the device (default: 4370)
            device_name: Friendly name for the device
            min_sync_date: Only sync attendance on or after this date (YYYY-MM-DD)
        """
        self.device_ip = device_ip
        self.device_port = device_port
        self.device_name = device_name
        self.min_sync_date = None
        if min_sync_date:
            self.min_sync_date = datetime.fromisoformat(min_sync_date).replace(
                hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc
            )
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
                'events_processed': 0,
                'summaries_created': 0,
                'summaries_updated': 0,
                'summaries_unchanged': 0,
                'daily_summaries': 0,
                'skipped_before_min_date': 0,
                'skipped_unknown_user': 0,
                'legacy_events': 0,
                'failed': 0,
            }
        }
        self._attendance_tz = ZoneInfo(
            os.getenv('ATTENDANCE_TIMEZONE', 'Africa/Algiers')
        )
    
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
        from config import Config
        logger.info(f"Connecting to device at {self.device_ip}:{self.device_port}...")
        return self.device_manager.connect(
            self.device_ip,
            self.device_port,
            timeout=Config.ZK_DEVICE_TIMEOUT,
            max_retries=Config.ZK_DEVICE_MAX_RETRIES,
        )
    
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
            logger.info("No users found on device")
            return True
        
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

        existing_user = self.db.users.find_one({'biometric_id': device_uid})

        if not existing_user:
            matches = []
            seen_ids = set()
            for emp_id in employee_id_candidates(str(device_user_id)):
                user = self._find_user_by_employee_id(emp_id)
                if user and user['_id'] not in seen_ids:
                    seen_ids.add(user['_id'])
                    matches.append(user)
            existing_user = pick_best_device_user_match(matches, str(device_user_id))
        
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
            
            # Create user directly in database (preserve device biometric_id)
            if self.db.users.find_one({'employee_id': user_data['employee_id']}):
                logger.error(f"Employee ID already exists: {user_data['employee_id']}")
                return False

            if self.db.users.find_one({'email': user_data['email']}):
                user_data['email'] = f"{user_data['employee_id'].lower()}@company.com"

            if self.db.users.find_one({'biometric_id': user_data['biometric_id']}):
                logger.error(f"Biometric ID already exists: {user_data['biometric_id']}")
                return False

            user_data.setdefault('department', 'Unassigned')
            user_data.setdefault('position', 'Employee')
            user_data.setdefault('password', '')
            user_data.setdefault('has_web_account', False)
            user_data.setdefault('leave_balance', {'annual': 20, 'sick': 10, 'unpaid': 5})

            self.db.users.insert_one(user_data)
            return True
                
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
                'device_user_id': str(device_user['user_id']),
            }

            if device_user.get('uid') is not None and not existing_user.get('biometric_id'):
                update_data['biometric_id'] = device_user['uid']
            
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
        Sync attendance from device into daily worked-hours summaries.

        Raw device punches are aggregated in memory and never stored individually.
        """
        logger.info("=" * 80)
        logger.info("SYNCING ATTENDANCE → DAILY WORKED-HOURS SUMMARIES")
        logger.info("=" * 80)

        device_logs = self.device_manager.get_attendance_logs()
        self.stats['attendance']['total_on_device'] = len(device_logs)

        if device_logs:
            logger.info(f"Retrieved {len(device_logs)} raw attendance events from device")
            if limit:
                device_logs = device_logs[:limit]
                logger.info(f"Limiting sync to {limit} events")
            device_logs.sort(key=lambda x: x['timestamp'])
        else:
            logger.info("No attendance logs found on device")

        device_events = self._collect_device_events(device_logs) if device_logs else []
        legacy_events = self._collect_legacy_attendance_events()
        events = device_events + legacy_events
        self.stats['attendance']['events_processed'] = len(events)
        self.stats['attendance']['legacy_events'] = len(legacy_events)

        if not events:
            logger.info("No attendance events to aggregate after filtering")
            return True

        summaries = aggregate_events_to_daily_summaries(events, self._attendance_tz)
        self.stats['attendance']['daily_summaries'] = len(summaries)

        upsert_stats = upsert_daily_summaries(
            self.db,
            summaries,
            device_id=self.device_name,
            source='device_sync',
        )
        self.stats['attendance']['summaries_created'] = upsert_stats['created']
        self.stats['attendance']['summaries_updated'] = upsert_stats['updated']
        self.stats['attendance']['summaries_unchanged'] = upsert_stats['unchanged']

        self._print_attendance_sync_summary()

        if clear_after_sync and (
            upsert_stats['created'] + upsert_stats['updated'] > 0
        ):
            confirmation = input(
                "\n⚠️  Are you sure you want to CLEAR device logs? (yes/no): "
            ).strip().lower()
            if confirmation == 'yes':
                if self.device_manager.clear_attendance_logs():
                    logger.info("✓ Device attendance logs cleared successfully")
                else:
                    logger.error("✗ Failed to clear device logs")

        return True

    def _collect_device_events(self, device_logs: List[Dict]) -> List[AttendanceEvent]:
        """Map device punches to employee events (timestamps only)."""
        events: List[AttendanceEvent] = []

        for device_log in device_logs:
            try:
                timestamp = normalize_device_timestamp(device_log.get('timestamp', ''))
            except Exception:
                logger.error(f"Invalid timestamp format: {device_log.get('timestamp')}")
                self.stats['attendance']['failed'] += 1
                continue

            if self.min_sync_date:
                if timestamp < self.min_sync_date.replace(tzinfo=None):
                    self.stats['attendance']['skipped_before_min_date'] += 1
                    continue

            device_user_id = device_log.get('user_id', '')
            user = self._find_user_by_device_id(device_user_id)
            if not user:
                logger.warning(
                    "User not found for device_user_id: %s — skipping event",
                    device_user_id,
                )
                self.stats['attendance']['skipped_unknown_user'] += 1
                continue

            employee_id = user.get('employee_id')
            events.append(AttendanceEvent(employee_id=employee_id, timestamp=timestamp))

        return events

    def _collect_legacy_attendance_events(self) -> List[AttendanceEvent]:
        """Rebuild events from previously stored raw attendance logs (timestamps only)."""
        events: List[AttendanceEvent] = []
        if self.db is None:
            return events

        for doc in self.db.attendance.find({}, {'employee_id': 1, 'timestamp': 1}):
            employee_id = doc.get('employee_id')
            timestamp = doc.get('timestamp')
            if not employee_id or not timestamp:
                continue
            try:
                ts = normalize_device_timestamp(timestamp)
            except Exception:
                self.stats['attendance']['failed'] += 1
                continue

            if self.min_sync_date and ts < self.min_sync_date.replace(tzinfo=None):
                continue

            events.append(AttendanceEvent(employee_id=employee_id, timestamp=ts))

        if events:
            logger.info('Loaded %s legacy attendance events from database', len(events))
        return events
    
    def _find_user_by_device_id(self, device_user_id: str) -> Dict:
        """Find user in database by device attendance log user_id."""
        return find_user_for_device_user_id(self.db, str(device_user_id))

    def _find_user_by_employee_id(self, employee_id: str) -> Dict:
        """Find a user by employee_id using the syncer's database connection."""
        return self.db.users.find_one({'employee_id': employee_id})
    
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
        stats = self.stats['attendance']
        print("\n" + "=" * 80)
        print("  DAILY ATTENDANCE SUMMARY SYNC")
        print("=" * 80)
        print(f"  Raw events on device:      {stats['total_on_device']}")
        print(f"  Events processed:          {stats['events_processed']}")
        print(f"  Legacy DB events merged:   {stats['legacy_events']}")
        print(f"  Daily summaries built:     {stats['daily_summaries']}")
        print(f"  Summaries created:         {stats['summaries_created']}")
        print(f"  Summaries updated:         {stats['summaries_updated']}")
        print(f"  Summaries unchanged:       {stats['summaries_unchanged']}")
        print(f"  Before min date skipped:   {stats['skipped_before_min_date']}")
        print(f"  Unknown user skipped:      {stats['skipped_unknown_user']}")
        print(f"  Failed:                    {stats['failed']}")
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
