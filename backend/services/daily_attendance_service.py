"""
Persistence layer for daily attendance summaries.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from models.daily_attendance_model import DailyAttendanceModel
from services.daily_attendance_aggregator import DailyWorkedSummary

logger = logging.getLogger(__name__)


def upsert_daily_summaries(
    db,
    summaries: List[DailyWorkedSummary],
    *,
    device_id: str = 'ZKTeco Device',
    source: str = 'device_sync',
) -> Dict[str, int]:
    """
    Idempotently upsert daily summaries keyed by (employee_id, date).

    Returns counts: created, updated, unchanged.
    """
    stats = {'created': 0, 'updated': 0, 'unchanged': 0}
    collection = db[DailyAttendanceModel.COLLECTION]

    for summary in summaries:
        doc = DailyAttendanceModel.build_document(
            summary,
            device_id=device_id,
            source=source,
        )
        existing = collection.find_one({
            'employee_id': summary.employee_id,
            'date': summary.date,
        })

        if not existing:
            doc['created_at'] = doc['updated_at']
            collection.insert_one(doc)
            stats['created'] += 1
            continue

        comparable_fields = (
            'total_worked_minutes',
            'total_worked_hours',
            'worked_time_display',
            'event_count',
            'pair_count',
            'unmatched_events',
            'check_in_at',
            'check_out_at',
            'first_event_at',
            'last_event_at',
        )
        changed = any(existing.get(f) != doc.get(f) for f in comparable_fields)

        if changed:
            collection.update_one(
                {'_id': existing['_id']},
                {'$set': doc},
            )
            stats['updated'] += 1
        else:
            stats['unchanged'] += 1

    return stats


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
        start = datetime.now() - timedelta(days=default_lookback_days)
        date_filter['$gte'] = start.strftime('%Y-%m-%d')
    if end_date:
        date_filter['$lte'] = end_date
    else:
        date_filter['$lte'] = datetime.now().strftime('%Y-%m-%d')
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
