"""
ZKTeco Device Manager
=====================
A production-ready Python module for communicating with ZKTeco fingerprint 
attendance devices using the pyzk library.

Purpose:
- Read user data and attendance logs from ZKTeco devices
- Provide structured data ready for database storage or API sync
- Handle device communication safely with proper error handling

NOT for enrollment or fingerprint capture - only for reading existing data.
"""

import logging
import time
from datetime import datetime, timezone
from typing import List, Dict, Optional, Callable
from zk import ZK
from zk.exception import ZKError, ZKErrorConnection, ZKErrorResponse

from config import Config

# Configure logging
logger = logging.getLogger(__name__)

# Errors that often clear on retry (device busy, another client, flaky LAN)
_TRANSIENT_CONNECT_MARKERS = (
    'broken pipe',
    'connection reset',
    'timed out',
    'timeout',
    'errno 32',
    'errno 104',
    'errno 110',
    'errno 111',
    'connection refused',
    'device is locked',
)


def _is_transient_connect_error(exc: BaseException) -> bool:
    message = str(exc).lower()
    return any(marker in message for marker in _TRANSIENT_CONNECT_MARKERS)


class ZKDeviceManager:
    """
    Manager class for ZKTeco fingerprint device communication.
    
    Handles safe connection, data retrieval, and device state management.
    Implements retry logic and proper error handling for production use.
    """
    
    def __init__(self):
        """Initialize the device manager."""
        self.zk = None
        self.conn = None
        self.ip_address = None
        self.port = None
        self.is_connected = False

    def _reset_connection(self) -> None:
        """Drop any half-open SDK connection before retrying."""
        if self.conn:
            try:
                self.conn.enable_device()
            except Exception:
                pass
            try:
                self.conn.disconnect()
            except Exception:
                pass
        self.conn = None
        self.zk = None
        self.is_connected = False
        
    def connect(
        self, 
        ip: str, 
        port: int = 4370, 
        timeout: int = 15,
        max_retries: int = 5
    ) -> bool:
        """
        Connect to ZKTeco device with retry logic.
        
        Args:
            ip: Device IP address
            port: Device port (default: 4370)
            timeout: Connection timeout in seconds
            max_retries: Number of connection attempts
            
        Returns:
            bool: True if connected successfully, False otherwise
        """
        self.ip_address = ip
        self.port = port
        
        for attempt in range(1, max_retries + 1):
            self._reset_connection()
            force_udp = attempt >= max_retries - 1
            try:
                logger.info(
                    "Attempting to connect to %s:%s (attempt %s/%s, udp=%s)",
                    ip, port, attempt, max_retries, force_udp,
                )
                
                # Skip ICMP ping — Docker/WiFi often blocks it while TCP 4370 still works
                self.zk = ZK(
                    ip,
                    port=port,
                    timeout=timeout,
                    password=Config.ZK_DEVICE_PASSWORD,
                    force_udp=force_udp,
                    ommit_ping=True,
                )
                
                # Establish connection
                self.conn = self.zk.connect()
                
                # Disable device to prevent interference during data reading
                self.conn.disable_device()
                
                self.is_connected = True
                logger.info(f"Successfully connected to device at {ip}:{port}")
                return True
                
            except ZKErrorConnection as e:
                logger.warning(f"Connection attempt {attempt} failed: {e}")
                    
            except ZKError as e:
                if _is_transient_connect_error(e):
                    logger.warning(f"Transient ZK error on attempt {attempt}: {e}")
                else:
                    logger.error(f"ZK SDK error during connection: {e}")
                    break
                    
            except Exception as e:
                if _is_transient_connect_error(e):
                    logger.warning(f"Transient error on attempt {attempt}: {e}")
                else:
                    logger.error(f"Unexpected error during connection: {e}")
                    break

            if attempt < max_retries:
                wait_time = min(2 ** attempt, 10)
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                logger.error(f"Failed to connect after {max_retries} attempts")
        
        self._reset_connection()
        return False
    
    def disconnect(self) -> None:
        """
        Safely disconnect from the device.
        
        Always enables the device and closes the connection properly,
        even if errors occurred during operations.
        """
        if self.conn:
            try:
                # Always re-enable device before disconnecting
                self.conn.enable_device()
                logger.info("Device re-enabled")
            except Exception as e:
                logger.warning(f"Could not enable device: {e}")
            
            try:
                self.conn.disconnect()
                logger.info("Disconnected from device")
            except Exception as e:
                logger.warning(f"Error during disconnect: {e}")
        
        self.conn = None
        self.zk = None
        self.is_connected = False
    
    def get_users(self) -> List[Dict]:
        """
        Retrieve all users from the device.
        
        Returns:
            List of user dictionaries with keys:
            - uid: User ID in device
            - user_id: User's badge/card number
            - name: User's name
            - privilege: User privilege level (0=User, 1=Enroller, 2=Manager, 6=Admin)
            - password: User password (if set)
            - group_id: User's group ID
            - card: Card number (if applicable)
            
        Returns empty list on error.
        """
        if not self.is_connected or not self.conn:
            logger.error("Not connected to device")
            return []
        
        try:
            logger.info("Retrieving users from device...")
            users = self.conn.get_users()
            
            user_list = []
            for user in users:
                user_data = {
                    'uid': user.uid,
                    'user_id': user.user_id,
                    'name': user.name,
                    'privilege': user.privilege,
                    'password': user.password if user.password else '',
                    'group_id': user.group_id if hasattr(user, 'group_id') else '',
                    'card': user.card if user.card else 0
                }
                user_list.append(user_data)
            
            logger.info(f"Retrieved {len(user_list)} users from device")
            return user_list
            
        except ZKErrorResponse as e:
            logger.error(f"Device response error while getting users: {e}")
            return []
            
        except ZKError as e:
            logger.error(f"ZK SDK error while getting users: {e}")
            return []
            
        except Exception as e:
            logger.error(f"Unexpected error while getting users: {e}")
            return []
    
    def get_attendance_logs(self) -> List[Dict]:
        """
        Retrieve all attendance logs from the device.
        
        Returns:
            List of attendance dictionaries with keys:
            - user_id: User's badge/card number
            - timestamp: Attendance timestamp (timezone-aware UTC)
            - status: Attendance status code
            - punch: Punch type (0=Check-In, 1=Check-Out, 2=Break-Out, 3=Break-In, 4=OT-In, 5=OT-Out)
            
        Returns empty list on error.
        """
        if not self.is_connected or not self.conn:
            logger.error("Not connected to device")
            return []
        
        try:
            logger.info("Retrieving attendance logs from device...")
            attendances = self.conn.get_attendance()
            
            attendance_list = []
            for att in attendances:
                # Device stores local wall-clock time; keep as naive datetime
                timestamp = att.timestamp
                if timestamp.tzinfo is not None:
                    timestamp = timestamp.replace(tzinfo=None)
                
                attendance_data = {
                    'user_id': att.user_id,
                    'timestamp': timestamp.isoformat(),
                    'status': att.status,
                    'punch': att.punch,
                    'punch_type': self._get_punch_type_name(att.punch),
                    'state_label': self._get_state_type_name(att.status),
                }
                attendance_list.append(attendance_data)
            
            logger.info(f"Retrieved {len(attendance_list)} attendance records from device")
            return attendance_list
            
        except ZKErrorResponse as e:
            logger.error(f"Device response error while getting attendance: {e}")
            return []
            
        except ZKError as e:
            logger.error(f"ZK SDK error while getting attendance: {e}")
            return []
            
        except Exception as e:
            logger.error(f"Unexpected error while getting attendance: {e}")
            return []
    
    def clear_attendance_logs(self) -> bool:
        """
        Clear all attendance logs from the device.
        
        WARNING: This permanently deletes attendance data from the device.
        Use only after successfully backing up data to your database.
        
        Returns:
            bool: True if cleared successfully, False otherwise
        """
        if not self.is_connected or not self.conn:
            logger.error("Not connected to device")
            return False
        
        try:
            logger.warning("Clearing attendance logs from device...")
            self.conn.clear_attendance()
            logger.info("Attendance logs cleared successfully")
            return True
            
        except ZKErrorResponse as e:
            logger.error(f"Device response error while clearing attendance: {e}")
            return False
            
        except ZKError as e:
            logger.error(f"ZK SDK error while clearing attendance: {e}")
            return False
            
        except Exception as e:
            logger.error(f"Unexpected error while clearing attendance: {e}")
            return False
    
    def get_device_info(self) -> Dict:
        """
        Retrieve device information and status.
        
        Returns:
            Dictionary with device information:
            - ip: Device IP address
            - port: Device port
            - serial_number: Device serial number
            - firmware_version: Firmware version
            - platform: Device platform
            - device_name: Device name
            - user_count: Number of users in device
            - log_count: Number of attendance records
            - log_capacity: Maximum log capacity
            - user_capacity: Maximum user capacity
            
        Returns empty dict on error.
        """
        if not self.is_connected or not self.conn:
            logger.error("Not connected to device")
            return {}
        
        try:
            logger.info("Retrieving device information...")
            
            # Get basic device info
            info = {
                'ip': self.ip_address,
                'port': self.port,
                'is_connected': self.is_connected
            }
            
            # Get serial number
            try:
                info['serial_number'] = self.conn.get_serialnumber()
            except:
                info['serial_number'] = 'Unknown'
            
            # Get firmware version
            try:
                info['firmware_version'] = self.conn.get_firmware_version()
            except:
                info['firmware_version'] = 'Unknown'
            
            # Get platform
            try:
                info['platform'] = self.conn.get_platform()
            except:
                info['platform'] = 'Unknown'
            
            # Get device name
            try:
                info['device_name'] = self.conn.get_device_name()
            except:
                info['device_name'] = 'Unknown'
            
            # Get user count
            try:
                users = self.conn.get_users()
                info['user_count'] = len(users)
            except:
                info['user_count'] = 0
            
            # Get attendance log count
            try:
                logs = self.conn.get_attendance()
                info['log_count'] = len(logs)
            except:
                info['log_count'] = 0
            
            logger.info(f"Device info retrieved: {info.get('device_name', 'Unknown')}")
            return info
            
        except Exception as e:
            logger.error(f"Error retrieving device info: {e}")
            return {
                'ip': self.ip_address,
                'port': self.port,
                'is_connected': False,
                'error': str(e)
            }
    
    def stream_realtime_logs(
        self, 
        callback: Callable[[Dict], None],
        duration: Optional[int] = None
    ) -> None:
        """
        Stream real-time attendance logs from the device.
        
        This method captures attendance events as they happen on the device.
        Useful for live monitoring and immediate synchronization.
        
        Args:
            callback: Function to call for each attendance event.
                      Receives attendance dict with same structure as get_attendance_logs()
            duration: Optional duration in seconds to capture (None = infinite)
        
        Example:
            def handle_attendance(att_data):
                print(f"User {att_data['user_id']} punched at {att_data['timestamp']}")
            
            manager.stream_realtime_logs(handle_attendance, duration=60)
        """
        if not self.is_connected or not self.conn:
            logger.error("Not connected to device")
            return
        
        try:
            logger.info("Starting real-time attendance capture...")
            
            # Re-enable device for live capture
            self.conn.enable_device()
            
            start_time = time.time()
            
            for attendance in self.conn.live_capture():
                # Check if duration limit reached
                if duration and (time.time() - start_time) > duration:
                    logger.info(f"Real-time capture stopped after {duration} seconds")
                    break
                
                if attendance is None:
                    continue
                
                # Format attendance data
                timestamp = attendance.timestamp
                if timestamp.tzinfo is None:
                    timestamp = timestamp.replace(tzinfo=timezone.utc)
                
                att_data = {
                    'user_id': attendance.user_id,
                    'timestamp': timestamp.isoformat(),
                    'status': attendance.status,
                    'punch': attendance.punch,
                    'punch_type': self._get_punch_type_name(attendance.punch)
                }
                
                logger.info(f"Real-time capture: User {att_data['user_id']} - {att_data['punch_type']}")
                
                # Call the callback function
                try:
                    callback(att_data)
                except Exception as e:
                    logger.error(f"Error in callback function: {e}")
            
        except KeyboardInterrupt:
            logger.info("Real-time capture interrupted by user")
            
        except ZKError as e:
            logger.error(f"ZK SDK error during live capture: {e}")
            
        except Exception as e:
            logger.error(f"Unexpected error during live capture: {e}")
        
        finally:
            # Disable device again after live capture
            try:
                self.conn.disable_device()
            except:
                pass
    
    def _get_punch_type_name(self, punch_code: int) -> str:
        """Legacy name helper — on many devices punch is attendance state."""
        return self._get_state_type_name(punch_code)

    def _get_state_type_name(self, state_code: int) -> str:
        """Convert attendance state code to human-readable name."""
        state_types = {
            0: 'Check-In',
            1: 'Check-Out',
            2: 'Break-Out',
            3: 'Break-In',
            4: 'OT-In',
            5: 'OT-Out',
        }
        return state_types.get(state_code, f'Code({state_code})')
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - ensures proper cleanup."""
        self.disconnect()
        return False


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

def example_basic_usage():
    """Example: Basic connection and data retrieval."""
    manager = ZKDeviceManager()
    
    # Connect to device
    if manager.connect('192.168.100.5', port=4370):
        try:
            # Get device info
            info = manager.get_device_info()
            print(f"Connected to: {info.get('device_name')}")
            print(f"Users: {info.get('user_count')}, Logs: {info.get('log_count')}")
            
            # Get all users
            users = manager.get_users()
            print(f"\nRetrieved {len(users)} users")
            
            # Get attendance logs
            logs = manager.get_attendance_logs()
            print(f"Retrieved {len(logs)} attendance records")
            
            # Here you would send this data to your API or database
            # Example: requests.post('http://your-api/sync', json={'users': users, 'logs': logs})
            
        finally:
            manager.disconnect()
    else:
        print("Failed to connect to device")


def example_context_manager():
    """Example: Using context manager for automatic cleanup."""
    with ZKDeviceManager() as manager:
        if manager.connect('192.168.100.5'):
            users = manager.get_users()
            logs = manager.get_attendance_logs()
            
            # Process data
            return {'users': users, 'logs': logs}
    # Device automatically disconnected


def example_realtime_monitoring():
    """Example: Real-time attendance monitoring."""
    def handle_attendance(att_data):
        """Process each attendance event as it happens."""
        print(f"[LIVE] User {att_data['user_id']}: {att_data['punch_type']} at {att_data['timestamp']}")
        
        # Send to API in real-time
        # requests.post('http://your-api/attendance/live', json=att_data)
    
    manager = ZKDeviceManager()
    if manager.connect('192.168.100.5'):
        try:
            # Monitor for 5 minutes
            manager.stream_realtime_logs(handle_attendance, duration=300)
        finally:
            manager.disconnect()


def example_flask_integration():
    """Example: Integration with Flask API."""
    from flask import Flask, jsonify, request
    
    app = Flask(__name__)
    
    @app.route('/api/device/sync', methods=['POST'])
    def sync_device():
        """Endpoint to sync data from ZKTeco device."""
        data = request.json
        ip = data.get('ip')
        port = data.get('port', 4370)
        
        manager = ZKDeviceManager()
        
        if not manager.connect(ip, port):
            return jsonify({'error': 'Failed to connect to device'}), 500
        
        try:
            users = manager.get_users()
            logs = manager.get_attendance_logs()
            
            # Store in your database here
            # db.users.insert_many(users)
            # db.attendance.insert_many(logs)
            
            # Optionally clear device logs after successful backup
            if data.get('clear_after_sync', False):
                manager.clear_attendance_logs()
            
            return jsonify({
                'success': True,
                'users_synced': len(users),
                'logs_synced': len(logs)
            })
            
        finally:
            manager.disconnect()
    
    return app


if __name__ == '__main__':
    # Configure logging for testing
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run basic example
    print("ZKTeco Device Manager - Example Usage")
    print("=" * 50)
    example_basic_usage()
