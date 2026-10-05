"""
Background scheduler for automatic ZKTeco device synchronization.

Default mode: run at fixed local times (e.g. 08:00, 08:30, 09:00).
Legacy fallback: interval minutes when ZK_SYNC_TIMES is empty and
ZK_SYNC_INTERVAL_MINUTES > 0.
Manual "Sync from Device" remains available anytime via the API.
"""

from __future__ import annotations

import logging
import threading
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from zoneinfo import ZoneInfo

from config import Config
from services.device_sync_service import run_device_sync, sync_status

logger = logging.getLogger(__name__)


def format_sync_times(times: List[Tuple[int, int]]) -> str:
    return ', '.join(f'{h:02d}:{m:02d}' for h, m in times)


def seconds_until_next_schedule(
    times: List[Tuple[int, int]],
    *,
    now: Optional[datetime] = None,
    tz_name: Optional[str] = None,
) -> float:
    """Seconds until the next scheduled HH:MM in the attendance timezone."""
    if not times:
        return 60.0

    tz = ZoneInfo(tz_name or Config.ATTENDANCE_TIMEZONE)
    current = now.astimezone(tz) if now and now.tzinfo else (now or datetime.now(tz))
    if current.tzinfo is None:
        current = current.replace(tzinfo=tz)

    candidates: List[datetime] = []
    for hour, minute in times:
        candidate = current.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if candidate <= current:
            candidate += timedelta(days=1)
        candidates.append(candidate)

    next_run = min(candidates)
    return max((next_run - current).total_seconds(), 1.0)


class ZKSyncScheduler:
    """Syncs users and attendance from the ZKTeco device on a schedule."""

    def __init__(self, app):
        self._app = app
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._sync_times = Config.parse_zk_sync_times()
        self._use_interval = (
            not self._sync_times and max(Config.ZK_SYNC_INTERVAL_MINUTES, 0) > 0
        )

    def start(self) -> None:
        sync_status['auto_sync_enabled'] = Config.ZK_SYNC_ENABLED
        sync_status['sync_interval_minutes'] = (
            Config.ZK_SYNC_INTERVAL_MINUTES if self._use_interval else None
        )
        sync_status['sync_times'] = [f'{h:02d}:{m:02d}' for h, m in self._sync_times]
        sync_status['sync_schedule_label'] = (
            format_sync_times(self._sync_times)
            if self._sync_times
            else (
                f'every {Config.ZK_SYNC_INTERVAL_MINUTES} min'
                if self._use_interval
                else None
            )
        )

        if not Config.ZK_SYNC_ENABLED:
            logger.info('ZKTeco auto-sync is disabled (ZK_SYNC_ENABLED=false)')
            return

        if not Config.ZK_DEVICE_IP:
            logger.warning('ZKTeco auto-sync enabled but ZK_DEVICE_IP is not set')
            return

        if not self._sync_times and not self._use_interval:
            logger.warning(
                'ZKTeco auto-sync enabled but no ZK_SYNC_TIMES / interval configured'
            )
            return

        if self._thread and self._thread.is_alive():
            return

        self._stop_event.clear()
        self._thread = threading.Thread(
            target=self._run_loop,
            daemon=True,
            name='zk-sync-scheduler',
        )
        self._thread.start()

        if self._sync_times:
            logger.info(
                'ZKTeco auto-sync started (times %s %s, device %s:%s)',
                format_sync_times(self._sync_times),
                Config.ATTENDANCE_TIMEZONE,
                Config.ZK_DEVICE_IP,
                Config.ZK_DEVICE_PORT,
            )
        else:
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
        # Brief delay so the app finishes booting before the first wait/sync
        self._stop_event.wait(10)
        if self._stop_event.is_set():
            return

        if self._use_interval:
            self._run_interval_loop()
        else:
            self._run_schedule_loop()

    def _run_interval_loop(self) -> None:
        interval_seconds = max(Config.ZK_SYNC_INTERVAL_MINUTES, 1) * 60
        while not self._stop_event.is_set():
            with self._app.app_context():
                run_device_sync(triggered_by='scheduler')
            self._stop_event.wait(interval_seconds)

    def _run_schedule_loop(self) -> None:
        last_slot_key: Optional[str] = None

        while not self._stop_event.is_set():
            wait_seconds = seconds_until_next_schedule(self._sync_times)
            next_label = datetime.now(
                ZoneInfo(Config.ATTENDANCE_TIMEZONE)
            ) + timedelta(seconds=wait_seconds)
            logger.info(
                'Next ZKTeco auto-sync at %s (%s)',
                next_label.strftime('%Y-%m-%d %H:%M'),
                Config.ATTENDANCE_TIMEZONE,
            )

            self._stop_event.wait(wait_seconds)
            if self._stop_event.is_set():
                return

            tz = ZoneInfo(Config.ATTENDANCE_TIMEZONE)
            now = datetime.now(tz)
            slot = self._matching_slot(now)
            if slot is None:
                # Woke slightly early or clock skew — retry soon
                self._stop_event.wait(5)
                continue

            slot_key = f'{now.date().isoformat()}-{slot[0]:02d}:{slot[1]:02d}'
            if slot_key == last_slot_key:
                self._stop_event.wait(30)
                continue

            with self._app.app_context():
                run_device_sync(triggered_by='scheduler')
            last_slot_key = slot_key

            # Avoid re-firing the same HH:MM if wait returns immediately
            self._stop_event.wait(60)

    def _matching_slot(self, now: datetime) -> Optional[Tuple[int, int]]:
        """Return the schedule slot if local time is within 90s of it."""
        for hour, minute in self._sync_times:
            slot = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            delta = abs((now - slot).total_seconds())
            if delta <= 90:
                return (hour, minute)
        return None
