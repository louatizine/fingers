"""
Aggregate raw attendance events into daily worked-hours summaries.

Events are paired sequentially per employee per day:
  1st → check-in, 2nd → check-out, 3rd → check-in, 4th → check-out, …
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Sequence, Tuple
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

# Collapse double-taps on the terminal (seconds)
BURST_PUNCH_SECONDS = 60
# Pairs shorter than this are treated as accidental duplicate check-outs
MIN_VALID_PAIR_MINUTES = 2
# Minimum gap (minutes) between lunch-out and evening-out to infer missing lunch return
LUNCH_BREAK_MIN_MINUTES = 120
# Hour (local) after which the last punch is treated as end-of-day check-out
END_OF_DAY_HOUR = 16


@dataclass(frozen=True)
class AttendanceEvent:
    employee_id: str
    timestamp: datetime


@dataclass
class DailyWorkedSummary:
    employee_id: str
    date: str
    total_worked_minutes: int
    event_count: int
    pair_count: int
    unmatched_events: int
    check_in_at: Optional[datetime] = None
    check_out_at: Optional[datetime] = None
    first_event_at: Optional[datetime] = None
    last_event_at: Optional[datetime] = None
    warnings: List[str] = field(default_factory=list)


def minutes_to_display(total_minutes: int) -> str:
    hours, mins = divmod(max(0, total_minutes), 60)
    return f'{hours:02d}:{mins:02d}'


def minutes_to_decimal_hours(total_minutes: int) -> float:
    return round(max(0, total_minutes) / 60, 2)


def deduplicate_events(events: Sequence[AttendanceEvent]) -> List[AttendanceEvent]:
    """Drop exact duplicate (employee_id, timestamp) pairs, keeping first occurrence."""
    seen: set[Tuple[str, datetime]] = set()
    unique: List[AttendanceEvent] = []
    for event in sorted(events, key=lambda e: (e.employee_id, e.timestamp)):
        key = (event.employee_id, event.timestamp)
        if key in seen:
            continue
        seen.add(key)
        unique.append(event)
    return unique


def local_date_for_timestamp(timestamp: datetime, tz: ZoneInfo) -> str:
    """
    Resolve the calendar date for an event in the configured local timezone.

    Device timestamps are stored as naive local wall-clock times. When a
    timezone-aware value is passed, it is converted first.
    """
    if timestamp.tzinfo is not None:
        timestamp = timestamp.astimezone(tz).replace(tzinfo=None)
    return timestamp.date().isoformat()


def group_events_by_employee_date(
    events: Sequence[AttendanceEvent],
    tz: ZoneInfo,
) -> Dict[Tuple[str, str], List[datetime]]:
    groups: Dict[Tuple[str, str], List[datetime]] = {}
    for event in events:
        day = local_date_for_timestamp(event.timestamp, tz)
        key = (event.employee_id, day)
        groups.setdefault(key, []).append(event.timestamp)
    for timestamps in groups.values():
        timestamps.sort()
    return groups


def collapse_burst_punches(
    sorted_ts: Sequence[datetime],
    burst_seconds: int = BURST_PUNCH_SECONDS,
) -> List[datetime]:
    """Merge consecutive punches within burst_seconds (double-tap on device)."""
    if not sorted_ts:
        return []
    collapsed = [sorted_ts[0]]
    for ts in sorted_ts[1:]:
        if (ts - collapsed[-1]).total_seconds() < burst_seconds:
            continue
        collapsed.append(ts)
    return collapsed


def collapse_invalid_terminal_pair(
    sorted_ts: Sequence[datetime],
    min_pair_minutes: int = MIN_VALID_PAIR_MINUTES,
) -> List[datetime]:
    """Drop trailing duplicate check-out that would form a near-zero final pair."""
    ts = list(sorted_ts)
    while len(ts) >= 2 and len(ts) % 2 == 0:
        pair_minutes = int((ts[-1] - ts[-2]).total_seconds() // 60)
        if pair_minutes < min_pair_minutes:
            ts.pop()
        else:
            break
    return ts


def normalize_day_timestamps(timestamps: Sequence[datetime]) -> List[datetime]:
    """Sort, collapse burst punches, then drop invalid terminal micro-pairs."""
    sorted_ts = sorted(timestamps)
    sorted_ts = collapse_burst_punches(sorted_ts)
    sorted_ts = collapse_invalid_terminal_pair(sorted_ts)
    return sorted_ts


def is_missing_lunch_return_pattern(timestamps: Sequence[datetime]) -> bool:
    """
  True when three punches look like: check-in, lunch check-out, evening check-out
  with no afternoon check-in (common when employees forget the return punch).
    """
    if len(timestamps) != 3:
        return False
    morning_in, lunch_out, evening_out = timestamps
    if not (morning_in < lunch_out < evening_out):
        return False
    lunch_gap_minutes = (evening_out - lunch_out).total_seconds() / 60
    return lunch_gap_minutes >= LUNCH_BREAK_MIN_MINUTES and evening_out.hour >= END_OF_DAY_HOUR


def calculate_daily_worked_minutes(
    timestamps: Sequence[datetime],
    *,
    employee_id: str = '',
    date: str = '',
) -> Tuple[int, int, int, Optional[datetime], Optional[datetime], List[str]]:
    """
    Pair events sequentially and sum valid in→out durations.

    Returns:
        total_minutes, pair_count, unmatched_events, check_in_at, check_out_at,
        first_event, last_event, warnings
    """
    warnings: List[str] = []
    raw_sorted = sorted(timestamps)

    if not raw_sorted:
        return 0, 0, 0, None, None, None, None, warnings

    sorted_ts = normalize_day_timestamps(raw_sorted)

    if is_missing_lunch_return_pattern(sorted_ts):
        morning_in, lunch_out, evening_out = sorted_ts
        total_minutes = int((evening_out - morning_in).total_seconds() // 60)
        warnings.append(
            f'Missing lunch return punch for {employee_id} on {date}; '
            f'counted full-day span ({morning_in.strftime("%H:%M")} → '
            f'{evening_out.strftime("%H:%M")})'
        )
        logger.info(
            'Missing lunch return for %s on %s — full-day span %s min',
            employee_id,
            date,
            total_minutes,
        )
        return (
            total_minutes,
            2,
            0,
            morning_in,
            evening_out,
            raw_sorted[0],
            raw_sorted[-1],
            warnings,
        )

    if len(sorted_ts) % 2 != 0:
        warnings.append(
            f'Odd number of events ({len(sorted_ts)}) for {employee_id} on {date}; '
            'last event ignored'
        )
        logger.warning(
            'Odd attendance event count for %s on %s (%s events)',
            employee_id,
            date,
            len(sorted_ts),
        )

    total_minutes = 0
    pair_count = 0
    i = 0
    while i + 1 < len(sorted_ts):
        check_in = sorted_ts[i]
        check_out = sorted_ts[i + 1]
        if check_out > check_in:
            delta_minutes = int((check_out - check_in).total_seconds() // 60)
            total_minutes += delta_minutes
            pair_count += 1
        else:
            warnings.append(
                f'Invalid pair for {employee_id} on {date}: '
                f'{check_in.isoformat()} → {check_out.isoformat()}'
            )
            logger.warning(
                'Invalid attendance pair for %s on %s: %s not after %s',
                employee_id,
                date,
                check_out,
                check_in,
            )
        i += 2

    unmatched = len(sorted_ts) % 2
    check_in_at = sorted_ts[0]
    check_out_at = sorted_ts[-1] if pair_count > 0 else None
    return (
        total_minutes,
        pair_count,
        unmatched,
        check_in_at,
        check_out_at,
        raw_sorted[0],
        raw_sorted[-1],
        warnings,
    )


def build_daily_summary(
    employee_id: str,
    date: str,
    timestamps: Sequence[datetime],
) -> DailyWorkedSummary:
    total_minutes, pair_count, unmatched, check_in_at, check_out_at, first_evt, last_evt, warnings = (
        calculate_daily_worked_minutes(
            timestamps,
            employee_id=employee_id,
            date=date,
        )
    )
    return DailyWorkedSummary(
        employee_id=employee_id,
        date=date,
        total_worked_minutes=total_minutes,
        event_count=len(timestamps),
        pair_count=pair_count,
        unmatched_events=unmatched,
        check_in_at=check_in_at,
        check_out_at=check_out_at,
        first_event_at=first_evt,
        last_event_at=last_evt,
        warnings=warnings,
    )


def aggregate_events_to_daily_summaries(
    events: Sequence[AttendanceEvent],
    tz: ZoneInfo,
) -> List[DailyWorkedSummary]:
    """Group, deduplicate, and aggregate events into per-employee daily summaries."""
    unique_events = deduplicate_events(events)
    groups = group_events_by_employee_date(unique_events, tz)

    summaries: List[DailyWorkedSummary] = []
    for (employee_id, date), timestamps in sorted(groups.items()):
        summaries.append(build_daily_summary(employee_id, date, timestamps))
    return summaries
