"""
Persistence layer for daily attendance summaries.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from zoneinfo import ZoneInfo

from pymongo import InsertOne, UpdateOne

from config import Config
from models.daily_attendance_model import DailyAttendanceModel
from models.user_model import is_system_admin_account
from services.daily_attendance_aggregator import DailyWorkedSummary

logger = logging.getLogger(__name__)

_SUMMARY_COMPARE_FIELDS = (
    'total_worked_minutes',
    'total_worked_hours',
    'worked_time_display',
    'event_count',
    'pair_count',
    'unmatched_events',
    'check_in_at',
    'check_out_at',
    'lunch_out_at',
    'afternoon_in_at',
    'first_event_at',
    'last_event_at',
    'morning_late_minutes',
    'afternoon_late_minutes',
    'total_late_minutes',
    'late_display',
    'morning_early_minutes',
    'afternoon_early_minutes',
    'total_early_minutes',
    'early_display',
)
_UPSERT_BATCH_SIZE = 1000


def _local_today_str() -> str:
    tz = ZoneInfo(Config.ATTENDANCE_TIMEZONE)
    return datetime.now(tz).strftime('%Y-%m-%d')


def upsert_daily_summaries(
    db,
    summaries: List[DailyWorkedSummary],
    *,
    device_id: str = 'ZKTeco Device',
    source: str = 'device_sync',
) -> Dict[str, int]:
    """
    Idempotently upsert daily summaries keyed by (employee_id, date).

    Existing rows for the affected dates are loaded once, then writes are
    sent in batches. Unchanged days are not written.

    Returns counts: created, updated, unchanged.
    """
    stats = {'created': 0, 'updated': 0, 'unchanged': 0}
    if not summaries:
        return stats

    collection = db[DailyAttendanceModel.COLLECTION]
    existing_by_key = _load_existing_summaries(
        collection,
        {summary.date for summary in summaries},
    )

    operations = []
    for summary in summaries:
        doc = DailyAttendanceModel.build_document(
            summary,
            device_id=device_id,
            source=source,
        )
        existing = existing_by_key.get((summary.employee_id, summary.date))

        if not existing:
            doc['created_at'] = doc['updated_at']
            operations.append(InsertOne(doc))
            stats['created'] += 1
            continue

        changed = any(
            existing.get(field) != doc.get(field)
            for field in _SUMMARY_COMPARE_FIELDS
        )
        if changed:
            operations.append(UpdateOne({'_id': existing['_id']}, {'$set': doc}))
            stats['updated'] += 1
        else:
            stats['unchanged'] += 1

    for offset in range(0, len(operations), _UPSERT_BATCH_SIZE):
        collection.bulk_write(
            operations[offset:offset + _UPSERT_BATCH_SIZE],
            ordered=False,
        )

    return stats


def _load_existing_summaries(collection, dates: set) -> Dict[Tuple[Any, Any], dict]:
    """Load current summaries for the dates about to be written."""
    existing: Dict[Tuple[Any, Any], dict] = {}
    if not dates:
        return existing

    projection = {'_id': 1, 'employee_id': 1, 'date': 1}
    projection.update({field: 1 for field in _SUMMARY_COMPARE_FIELDS})
    date_list = list(dates)
    for offset in range(0, len(date_list), 200):
        chunk = date_list[offset:offset + 200]
        for doc in collection.find({'date': {'$in': chunk}}, projection):
            existing[(doc.get('employee_id'), doc.get('date'))] = doc
    return existing


def build_date_filter(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    *,
    default_lookback_days: int = 180,
) -> Dict[str, Any]:
    """Build a MongoDB filter on the ``date`` string field (YYYY-MM-DD)."""
    date_filter: Dict[str, Any] = {}
    if start_date:
        date_filter['$gte'] = start_date
    else:
        start = datetime.now(ZoneInfo(Config.ATTENDANCE_TIMEZONE)) - timedelta(days=default_lookback_days)
        date_filter['$gte'] = start.strftime('%Y-%m-%d')
    if end_date:
        date_filter['$lte'] = end_date
    else:
        date_filter['$lte'] = _local_today_str()
    return date_filter


def query_daily_summaries(
    db,
    *,
    employee_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> Tuple[List[dict], int]:
    query: Dict[str, Any] = {'date': build_date_filter(start_date, end_date)}
    if employee_id:
        query['employee_id'] = employee_id

    skip = max(0, (page - 1) * limit)
    collection = db[DailyAttendanceModel.COLLECTION]
    total = collection.count_documents(query)
    cursor = (
        collection.find(query)
        .sort([('date', -1), ('employee_id', 1)])
        .skip(skip)
        .limit(limit)
    )
    return list(cursor), total


def get_employee_summaries_in_range(
    db,
    employee_id: str,
    start_date: str,
    end_date: str,
) -> Dict[str, dict]:
    """Return summaries keyed by date string for one employee in a date range."""
    collection = db[DailyAttendanceModel.COLLECTION]
    docs = collection.find({
        'employee_id': employee_id,
        'date': {'$gte': start_date, '$lte': end_date},
    }).sort('date', 1)
    return {doc['date']: doc for doc in docs}


def get_summaries_for_date(db, date_str: str) -> Dict[str, dict]:
    """Return daily summaries keyed by employee_id for a single date."""
    collection = db[DailyAttendanceModel.COLLECTION]
    docs = collection.find({'date': date_str})
    return {doc['employee_id']: doc for doc in docs}


def get_active_employees(db) -> List[dict]:
    """Return active employees sorted by name."""
    users = list(db.users.find(
        {'is_active': {'$ne': False}},
        {
            'employee_id': 1,
            'email': 1,
            'first_name': 1,
            'last_name': 1,
            'department': 1,
            'position': 1,
        },
    ))
    users = [user for user in users if not is_system_admin_account(user)]
    users.sort(key=lambda u: (
        (u.get('first_name') or '').lower(),
        (u.get('last_name') or '').lower(),
    ))
    return users
