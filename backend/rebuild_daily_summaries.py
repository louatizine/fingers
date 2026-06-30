"""
Rebuild daily attendance summaries from device + legacy attendance timestamps.

Run after deploying aggregation fixes:
    python rebuild_daily_summaries.py
"""

import logging
import os
import sys

from dotenv import load_dotenv
from pymongo import MongoClient
from zoneinfo import ZoneInfo

from services.daily_attendance_aggregator import aggregate_events_to_daily_summaries
from services.daily_attendance_service import upsert_daily_summaries
from sync_device_to_db import DeviceToDBSyncer
from config import Config

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()


def main() -> int:
    syncer = DeviceToDBSyncer(
        device_ip=Config.ZK_DEVICE_IP,
        device_port=Config.ZK_DEVICE_PORT,
        device_name=Config.ZK_DEVICE_NAME,
        min_sync_date=Config.ZK_SYNC_MIN_DATE,
    )

    if not syncer.connect_to_database():
        logger.error('Failed to connect to database')
        return 1

    tz = ZoneInfo(os.getenv('ATTENDANCE_TIMEZONE', Config.ATTENDANCE_TIMEZONE))
    legacy_events = syncer._collect_legacy_attendance_events()
    logger.info('Collected %s legacy attendance events', len(legacy_events))

    device_events = []
    if syncer.connect_to_device():
        device_logs = syncer.device_manager.get_attendance_logs()
        device_logs.sort(key=lambda x: x['timestamp'])
        device_events = syncer._collect_device_events(device_logs)
        logger.info('Collected %s device attendance events', len(device_events))
    else:
        logger.warning('Device not reachable — rebuilding from legacy data only')

    events = legacy_events + device_events
    summaries = aggregate_events_to_daily_summaries(events, tz)
    logger.info('Built %s daily summaries', len(summaries))

    stats = upsert_daily_summaries(
        syncer.db,
        summaries,
        device_id=Config.ZK_DEVICE_NAME,
        source='rebuild',
    )
    logger.info(
        'Upsert complete: %s created, %s updated, %s unchanged',
        stats['created'],
        stats['updated'],
        stats['unchanged'],
    )
    return 0


if __name__ == '__main__':
    sys.exit(main())
