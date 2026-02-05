"""
Quick Device Sync - Automated version
Uses default values for quick testing
"""

import sys
import logging
from sync_device_to_db import DeviceToDBSyncer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

def main():
    """Run automated sync with default values."""
    print("=" * 80)
    print("  ZKTeco Device to Database Sync - Auto Mode")
    print("=" * 80)
    print()
    
    # Use default device settings
    device_ip = "192.168.100.5"
    device_port = 4370
    device_name = "ZKTeco K80"
    
    print(f"Device: {device_name}")
    print(f"IP: {device_ip}:{device_port}")
    print()
    
    # Initialize syncer
    syncer = DeviceToDBSyncer(device_ip, device_port, device_name)
    
    try:
        # Connect to database
        print("Connecting to MongoDB...")
        if not syncer.connect_to_database():
            print("❌ Failed to connect to database")
            return 1
        print("✅ Connected to database")
        print()
        
        # Connect to device
        print(f"Connecting to device at {device_ip}:{device_port}...")
        if not syncer.connect_to_device():
            print("❌ Failed to connect to device")
            return 1
        print("✅ Connected to device")
        print()
        
        # Perform full sync
        print("Starting full sync (users + attendance)...")
        print()
        
        success = syncer.full_sync(
            auto_create_users=True,    # Automatically create new users
            clear_device_after=False   # Don't clear device logs
        )
        
        if success:
            print()
            print("=" * 80)
            print("  ✅ SYNC COMPLETED SUCCESSFULLY")
            print("=" * 80)
            return 0
        else:
            print()
            print("=" * 80)
            print("  ❌ SYNC FAILED")
            print("=" * 80)
            return 1
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        return 1
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        logging.exception("Unexpected error during sync")
        return 1
        
    finally:
        print("\nDisconnecting from device...")
        syncer.disconnect()
        print("✅ Disconnected")


if __name__ == '__main__':
    sys.exit(main())
