"""
Background scheduler for automatic ZKTeco device synchronization.
"""

import logging
import threading
import time
from typing import Optional

from config import Config
from services.device_sync_service import run_device_sync, sync_status

logger = logging.getLogger(__name__)


class ZKSyncScheduler:
    """Periodically syncs users and attendance from the ZKTeco device."""

    def __init__(self, app):
        self._app = app
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def start(self) -> None:
        sync_status['auto_sync_enabled'] = Config.ZK_SYNC_ENABLED
        sync_status['sync_interval_minutes'] = Config.ZK_SYNC_INTERVAL_MINUTES

        if not Config.ZK_SYNC_ENABLED:
            logger.info('ZKTeco auto-sync is disabled (ZK_SYNC_ENABLED=false)')
            return

        if not Config.ZK_DEVICE_IP:
            logger.warning('ZKTeco auto-sync enabled but ZK_DEVICE_IP is not set')
            return

        if self._thread and self._thread.is_alive():
            return

        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_loop, daemon=True, name='zk-sync-scheduler')
        self._thread.start()

        logger.info(
            'ZKTeco auto-sync started (every %s minutes, device %s:%s)',
            Config.ZK_SYNC_INTERVAL_MINUTES,
            Config.ZK_DEVICE_IP,
            Config.ZK_DEVICE_PORT,
        )

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)

    def _run_loop(self) -> None:
        interval_seconds = max(Config.ZK_SYNC_INTERVAL_MINUTES, 1) * 60

        # Initial sync shortly after startup so data is available quickly
        self._stop_event.wait(10)
        if self._stop_event.is_set():
            return

        while not self._stop_event.is_set():
            with self._app.app_context():
                run_device_sync(triggered_by='scheduler')

            self._stop_event.wait(interval_seconds)
