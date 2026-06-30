"""
Daily attendance summary model and persistence helpers.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from services.daily_attendance_aggregator import (
    DailyWorkedSummary,
    minutes_to_decimal_hours,
    minutes_to_display,
)
from services.zk_attendance_utils import format_timestamp_for_api


class DailyAttendanceModel:
    """Model for persisted daily worked-hours summaries."""

    COLLECTION = 'daily_attendance_summaries'

    @staticmethod
    def to_dict(data: dict) -> dict:
        result = dict(data)
        if '_id' in result:
            result['_id'] = str(result['_id'])
        for field in ('check_in_at', 'check_out_at', 'first_event_at', 'last_event_at', 'updated_at', 'created_at'):
            if field in result and result[field] is not None:
                result[field] = format_timestamp_for_api(result[field])
        return result

    @staticmethod
    def build_document(
        summary: DailyWorkedSummary,
        *,
        device_id: str = 'ZKTeco Device',
        source: str = 'device_sync',
    ) -> Dict[str, Any]:
        now = datetime.utcnow()
        return {
            'employee_id': summary.employee_id,
            'date': summary.date,
            'total_worked_minutes': summary.total_worked_minutes,
            'total_worked_hours': minutes_to_decimal_hours(summary.total_worked_minutes),
            'worked_time_display': minutes_to_display(summary.total_worked_minutes),
            'event_count': summary.event_count,
            'pair_count': summary.pair_count,
            'unmatched_events': summary.unmatched_events,
            'check_in_at': summary.check_in_at,
            'check_out_at': summary.check_out_at,
            'first_event_at': summary.first_event_at,
            'last_event_at': summary.last_event_at,
            'device_id': device_id,
            'source': source,
            'updated_at': now,
        }

    @staticmethod
    def summary_to_response(doc: dict) -> dict:
        """API-friendly dict from a stored summary document."""
        pair_count = doc.get('pair_count', 0)
        check_in = doc.get('check_in_at') or doc.get('first_event_at')
        check_out = doc.get('check_out_at') if pair_count > 0 else None
        return {
            'employee_id': doc.get('employee_id'),
            'date': doc.get('date'),
            'worked_time_display': doc.get('worked_time_display', '00:00'),
            'total_worked_hours': doc.get('total_worked_hours', 0),
            'total_worked_minutes': doc.get('total_worked_minutes', 0),
            'worked_hours': doc.get('total_worked_hours', 0),
            'event_count': doc.get('event_count', 0),
            'pair_count': doc.get('pair_count', 0),
            'unmatched_events': doc.get('unmatched_events', 0),
            'check_in_at': format_timestamp_for_api(check_in) if check_in else None,
            'check_out_at': format_timestamp_for_api(check_out) if check_out else None,
            'check_in': format_timestamp_for_api(check_in) if check_in else None,
            'check_out': format_timestamp_for_api(check_out) if check_out else None,
            'first_event_at': format_timestamp_for_api(doc['first_event_at'])
            if doc.get('first_event_at')
            else None,
            'last_event_at': format_timestamp_for_api(doc['last_event_at'])
            if doc.get('last_event_at')
            else None,
            'device_id': doc.get('device_id'),
            'is_complete': (
                doc.get('unmatched_events', 0) == 0
                and doc.get('pair_count', 0) > 0
                and doc.get('total_worked_minutes', 0) > 0
            ),
            'has_records': doc.get('event_count', 0) > 0,
        }
