"""
Aggregate raw attendance events into daily worked-hours summaries.

Work runs 08:15–12:45, then again 14:00–17:30.
Each punch is placed by local time. A punch up to 10 minutes late
still stays in that column:
  before 10:40 → check-in
  10:40–13:32  → lunch departure
  13:32–15:55  → afternoon return
  15:55 on    → check-out
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
MIN_VALID_PAIR_MINUTES = 20
# Minimum gap (minutes) between lunch-out and evening-out to infer missing lunch return
LUNCH_BREAK_MIN_MINUTES = 120
# Hour (local) after which the last punch is treated as end-of-day check-out
END_OF_DAY_HOUR = 16
# Scheduled punch times, then a 10-minute lateness margin on each column boundary
LATE_GRACE_MINUTES = 10
CHECK_IN_AT_MINUTES = 8 * 60 + 15
LUNCH_OUT_AT_MINUTES = 12 * 60 + 45
AFTERNOON_IN_AT_MINUTES = 14 * 60
CHECK_OUT_AT_MINUTES = 17 * 60 + 30


def _slot_end_minutes(earlier: int, later: int) -> int:
    """Halfway to the next punch, plus the lateness margin."""
    return (earlier + later) // 2 + LATE_GRACE_MINUTES


CHECK_IN_UNTIL_MINUTES = _slot_end_minutes(CHECK_IN_AT_MINUTES, LUNCH_OUT_AT_MINUTES)
LUNCH_OUT_UNTIL_MINUTES = _slot_end_minutes(LUNCH_OUT_AT_MINUTES, AFTERNOON_IN_AT_MINUTES)
AFTERNOON_IN_UNTIL_MINUTES = _slot_end_minutes(AFTERNOON_IN_AT_MINUTES, CHECK_OUT_AT_MINUTES)
# Fixed lunch break removed from a span that covers it: 12:45–14:00
BREAK_START_MINUTES = 12 * 60 + 45
BREAK_END_MINUTES = 14 * 60


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
    lunch_out_at: Optional[datetime] = None
    afternoon_in_at: Optional[datetime] = None
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


def collapse_short_pairs(
    sorted_ts: Sequence[datetime],
    min_pair_minutes: int = MIN_VALID_PAIR_MINUTES,
) -> Tuple[List[datetime], List[str]]:
    """
    Drop accidental duplicate punches that would form too-short in→out pairs.

    Walks chronologically: if the next punch is within min_pair_minutes of the
    current open punch, discard the later one and keep the open punch so it can
    pair with a later real check-out.
    """
    warnings: List[str] = []
    ts = list(sorted_ts)
    result: List[datetime] = []
    i = 0
    while i < len(ts):
        if i + 1 >= len(ts):
            result.append(ts[i])
            break

        open_punch = ts[i]
        candidate = ts[i + 1]
        pair_minutes = (candidate - open_punch).total_seconds() / 60

        if pair_minutes < min_pair_minutes:
            warnings.append(
                f'Dropped short duplicate punch at {candidate.strftime("%H:%M")} '
                f'(within {min_pair_minutes} min of {open_punch.strftime("%H:%M")})'
            )
            # Keep open_punch; discard candidate; retry pairing open with next
            del ts[i + 1]
            continue

        result.append(open_punch)
        result.append(candidate)
        i += 2

    return result, warnings


def normalize_day_timestamps(
    timestamps: Sequence[datetime],
) -> Tuple[List[datetime], List[str]]:
    """Sort, collapse burst punches, then drop short accidental pairs."""
    sorted_ts = sorted(timestamps)
    sorted_ts = collapse_burst_punches(sorted_ts)
    sorted_ts, warnings = collapse_short_pairs(sorted_ts)
    return sorted_ts, warnings


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


def punch_slot(timestamp: datetime) -> str:
    """Map one punch to its appointment column using local wall-clock time."""
    minutes = timestamp.hour * 60 + timestamp.minute
    if minutes < CHECK_IN_UNTIL_MINUTES:
        return 'check_in'
    if minutes < LUNCH_OUT_UNTIL_MINUTES:
        return 'lunch_out'
    if minutes < AFTERNOON_IN_UNTIL_MINUTES:
        return 'afternoon_in'
    return 'check_out'


def assign_punch_slots(
    sorted_ts: Sequence[datetime],
) -> Tuple[Optional[datetime], Optional[datetime], Optional[datetime], Optional[datetime]]:
    """
    Place punches into check-in, lunch departure, afternoon return, and check-out.

    Several punches in one window keep the earliest arrival or return, and the
    latest lunch departure or check-out.
    """
    grouped: Dict[str, List[datetime]] = {
        'check_in': [],
        'lunch_out': [],
        'afternoon_in': [],
        'check_out': [],
    }
    for timestamp in sorted_ts:
        grouped[punch_slot(timestamp)].append(timestamp)

    check_in = grouped['check_in'][0] if grouped['check_in'] else None
    lunch_out = grouped['lunch_out'][-1] if grouped['lunch_out'] else None
    afternoon_in = grouped['afternoon_in'][0] if grouped['afternoon_in'] else None
    check_out = grouped['check_out'][-1] if grouped['check_out'] else None
    return check_in, lunch_out, afternoon_in, check_out


def _minutes_between(start: Optional[datetime], end: Optional[datetime]) -> int:
    if not start or not end or end <= start:
        return 0
    delta = int((end - start).total_seconds() // 60)
    if delta < MIN_VALID_PAIR_MINUTES:
        return 0
    return delta


def break_overlap_minutes(start: Optional[datetime], end: Optional[datetime]) -> int:
    """Minutes of 12:45–14:00 that fall inside a worked interval."""
    if not start or not end or end <= start:
        return 0
    start_m = start.hour * 60 + start.minute
    end_m = end.hour * 60 + end.minute
    overlap = min(end_m, BREAK_END_MINUTES) - max(start_m, BREAK_START_MINUTES)
    return max(0, overlap)


def _net_worked_minutes(start: Optional[datetime], end: Optional[datetime]) -> int:
    """Worked minutes in an interval after removing the standard lunch break."""
    gross = _minutes_between(start, end)
    if gross <= 0:
        return 0
    return max(0, gross - break_overlap_minutes(start, end))


def lunch_break_times(
    sorted_ts: Sequence[datetime],
) -> Tuple[Optional[datetime], Optional[datetime]]:
    """
    Lunch departure is the 2nd punch and afternoon return is the 3rd
    when the day includes a mid-day break.

    A two-punch day is morning arrival and end of day, so both stay empty.
    Three punches that match the missing-return pattern keep lunch departure
    and leave afternoon return empty.
    """
    if len(sorted_ts) < 3:
        return None, None
    if is_missing_lunch_return_pattern(sorted_ts):
        return sorted_ts[1], None
    return sorted_ts[1], sorted_ts[2]


def calculate_daily_worked_minutes(
    timestamps: Sequence[datetime],
    *,
    employee_id: str = '',
    date: str = '',
) -> Tuple[int, int, int, Optional[datetime], Optional[datetime], Optional[datetime], Optional[datetime], Optional[datetime], Optional[datetime], List[str]]:
    """
    Pair events sequentially and sum valid in→out durations.

    Returns:
        total_minutes, pair_count, unmatched_events, check_in_at, check_out_at,
        lunch_out_at, afternoon_in_at, first_event, last_event, warnings
    """
    warnings: List[str] = []
    raw_sorted = sorted(timestamps)

    if not raw_sorted:
        return 0, 0, 0, None, None, None, None, None, None, warnings

    sorted_ts, normalize_warnings = normalize_day_timestamps(raw_sorted)
    warnings.extend(normalize_warnings)

    check_in_at, lunch_out_at, afternoon_in_at, check_out_at = assign_punch_slots(sorted_ts)
    morning_minutes = _net_worked_minutes(check_in_at, lunch_out_at)
    afternoon_minutes = _net_worked_minutes(afternoon_in_at, check_out_at)

    if lunch_out_at and afternoon_in_at:
        total_minutes = morning_minutes + afternoon_minutes
        pair_count = (1 if morning_minutes else 0) + (1 if afternoon_minutes else 0)
    elif check_in_at and check_out_at:
        total_minutes = _net_worked_minutes(check_in_at, check_out_at)
        pair_count = 1 if total_minutes else 0
        removed = break_overlap_minutes(check_in_at, check_out_at)
        if removed:
            warnings.append(
                f'Removed {removed} min lunch break (12:45–14:00) for {employee_id} on {date}'
            )
    elif morning_minutes:
        total_minutes = morning_minutes
        pair_count = 1
    elif afternoon_minutes:
        total_minutes = afternoon_minutes
        pair_count = 1
    else:
        total_minutes = 0
        pair_count = 0

    unmatched = 0
    if check_in_at and not lunch_out_at and not check_out_at:
        unmatched += 1
    if afternoon_in_at and not check_out_at:
        unmatched += 1
    if check_out_at and not check_in_at and not afternoon_in_at:
        unmatched += 1
    if lunch_out_at and not check_in_at and not afternoon_in_at and not check_out_at:
        unmatched += 1

    return (
        total_minutes,
        pair_count,
        unmatched,
        check_in_at,
        check_out_at,
        lunch_out_at,
        afternoon_in_at,
        raw_sorted[0],
        raw_sorted[-1],
        warnings,
    )


def build_daily_summary(
    employee_id: str,
    date: str,
    timestamps: Sequence[datetime],
) -> DailyWorkedSummary:
    (
        total_minutes,
        pair_count,
        unmatched,
        check_in_at,
        check_out_at,
        lunch_out_at,
        afternoon_in_at,
        first_evt,
        last_evt,
        warnings,
    ) = calculate_daily_worked_minutes(
        timestamps,
        employee_id=employee_id,
        date=date,
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
        lunch_out_at=lunch_out_at,
        afternoon_in_at=afternoon_in_at,
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
