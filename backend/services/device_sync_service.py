"""
ZKTeco device synchronization service.

Runs user + attendance sync from the fingerprint terminal into MongoDB.
Used by the background scheduler and manual API trigger.
"""

import logging
import threading
from datetime import datetime, UTC
from typing import Any, Dict, Optional

from config import Config
from sync_device_to_db import DeviceToDBSyncer

logger = logging.getLogger(__name__)

_sync_lock = threading.Lock()

sync_status: Dict[str, Any] = {
    'running': False,
    'last_sync': None,
    'last_result': None,
    'error': None,
    'auto_sync_enabled': False,
    'sync_interval_minutes': None,
}


def _get_syncer() -> DeviceToDBSyncer:
    return DeviceToDBSyncer(
        device_ip=Config.ZK_DEVICE_IP,
        device_port=Config.ZK_DEVICE_PORT,
        device_name=Config.ZK_DEVICE_NAME,
        min_sync_date=Config.ZK_SYNC_MIN_DATE,
    )


def run_device_sync(
    *,
    triggered_by: str = 'scheduler',
    auto_create_users: bool = True,
    clear_device_after: bool = False,
) -> Dict[str, Any]:
    """
    Sync users and attendance from the ZKTeco device to MongoDB.

    Returns a result dict with success flag and statistics.
    """
    if not Config.ZK_DEVICE_IP:
        result = {
            'success': False,
            'message': 'ZK_DEVICE_IP is not configured',
            'error': 'missing_device_ip',
        }
        sync_status['last_result'] = result
        sync_status['error'] = result['message']
        return result

    if not _sync_lock.acquire(blocking=False):
        result = {
            'success': False,
            'message': 'Sync already in progress',
            'error': 'already_running',
        }
        return result

    syncer: Optional[DeviceToDBSyncer] = None

    try:
        sync_status['running'] = True
        sync_status['error'] = None

        logger.info('Starting ZKTeco device sync (triggered by %s)', triggered_by)

        syncer = _get_syncer()

        if not syncer.connect_to_database():
            result = {
                'success': False,
                'message': 'Failed to connect to database',
                'error': 'database_connection_failed',
            }
            sync_status['last_result'] = result
            sync_status['error'] = result['message']
            return result

        if not syncer.connect_to_device():
            result = {
                'success': False,
                'message': f"Failed to connect to device at {Config.ZK_DEVICE_IP}:{Config.ZK_DEVICE_PORT}",
                'error': 'device_connection_failed',
            }
            sync_status['last_result'] = result
            sync_status['error'] = result['message']
            return result

        success = syncer.full_sync(
            auto_create_users=auto_create_users,
            clear_device_after=clear_device_after,
        )

        stats = syncer.stats
        result = {
            'success': success,
            'message': 'Sync completed successfully' if success else 'Sync completed with errors',
            'triggered_by': triggered_by,
            'stats': stats,
        }

        sync_status['last_sync'] = datetime.now(UTC).isoformat()
        sync_status['last_result'] = result
        sync_status['error'] = None if success else result['message']

        if success:
            logger.info(
                'Device sync completed: %s new users, %s daily summaries created',
                stats['users']['new_created'],
                stats['attendance']['summaries_created'],
            )
        else:
            logger.warning('Device sync finished with errors')

        return result

    except Exception as exc:
        logger.exception('Device sync failed: %s', exc)
        result = {
            'success': False,
            'message': 'Sync failed',
            'error': str(exc),
        }
        sync_status['last_result'] = result
        sync_status['error'] = str(exc)
        return result

    finally:
        if syncer is not None:
            syncer.disconnect()
        sync_status['running'] = False
        _sync_lock.release()


def run_device_sync_async(
    *,
    triggered_by: str = 'manual',
    auto_create_users: bool = True,
    clear_device_after: bool = False,
) -> None:
    """Run device sync in a background thread."""
    thread = threading.Thread(
        target=run_device_sync,
        kwargs={
            'triggered_by': triggered_by,
            'auto_create_users': auto_create_users,
            'clear_device_after': clear_device_after,
        },
        daemon=True,
    )
    thread.start()
