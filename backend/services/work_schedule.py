"""
Configurable work schedule used for punch placement, lateness, and early arrival.

Default company hours: 08:15–12:45, then 14:00–17:30.
Online days (e.g. Friday): punches optional — no absence, no late/early penalty.
Values come from Settings → Attendance when present.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Sequence, Tuple

logger = logging.getLogger(__name__)

DEFAULT_CHECK_IN_START = '08:15'
DEFAULT_LUNCH_BREAK_START = '12:45'
DEFAULT_LUNCH_BREAK_END = '14:00'
DEFAULT_CHECK_OUT_END = '17:30'
# Margin used only for assigning punches to columns (not for late/early display)
DEFAULT_SLOT_GRACE_MINUTES = 10
DEFAULT_WORKING_DAYS: Tuple[str, ...] = ('Mon', 'Tue', 'Wed', 'Thu', 'Fri')
DEFAULT_ONLINE_DAYS: Tuple[str, ...] = ('Fri',)

WEEKDAY_CODES = ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')


def parse_hhmm_to_minutes(value: str | None, fallback: str) -> int:
    """Parse 'HH:MM' into minutes since midnight; fall back on invalid input."""
    raw = (value or '').strip() or fallback
    try:
        hour_str, minute_str = raw.split(':', 1)
        hour, minute = int(hour_str), int(minute_str)
        if not (0 <= hour <= 23 and 0 <= minute <= 59):
            raise ValueError('out of range')
        return hour * 60 + minute
    except (ValueError, TypeError):
        try:
            hour_str, minute_str = fallback.split(':', 1)
            return int(hour_str) * 60 + int(minute_str)
        except (ValueError, TypeError):
            return 0


def minutes_to_hhmm(total_minutes: int) -> str:
    hours, mins = divmod(max(0, int(total_minutes)), 60)
    return f'{hours:02d}:{mins:02d}'


def wall_clock_minutes(ts: datetime) -> int:
    return ts.hour * 60 + ts.minute


def normalize_day_codes(
    days: Optional[Sequence[str]],
    fallback: Sequence[str],
    *,
    allow_empty: bool = False,
) -> Tuple[str, ...]:
    # None → defaults; [] can mean "no online days" when allow_empty
    if days is None:
        return tuple(fallback)
    valid = []
    seen = set()
    for day in days:
        code = str(day).strip()[:3].title()
        if code in WEEKDAY_CODES and code not in seen:
            seen.add(code)
            valid.append(code)
    if valid:
        return tuple(valid)
    return () if allow_empty else tuple(fallback)


def weekday_code_for_date(date_str: str) -> str:
    """Return Mon/Tue/... for a YYYY-MM-DD date string."""
    return datetime.strptime(date_str, '%Y-%m-%d').strftime('%a')


@dataclass(frozen=True)
class WorkSchedule:
    check_in_start: str = DEFAULT_CHECK_IN_START
    lunch_break_start: str = DEFAULT_LUNCH_BREAK_START
    lunch_break_end: str = DEFAULT_LUNCH_BREAK_END
    check_out_end: str = DEFAULT_CHECK_OUT_END
    slot_grace_minutes: int = DEFAULT_SLOT_GRACE_MINUTES
    working_days: Tuple[str, ...] = field(default_factory=lambda: DEFAULT_WORKING_DAYS)
    online_days: Tuple[str, ...] = field(default_factory=lambda: DEFAULT_ONLINE_DAYS)

    @property
    def check_in_at_minutes(self) -> int:
        return parse_hhmm_to_minutes(self.check_in_start, DEFAULT_CHECK_IN_START)

    @property
    def lunch_out_at_minutes(self) -> int:
        return parse_hhmm_to_minutes(self.lunch_break_start, DEFAULT_LUNCH_BREAK_START)

    @property
    def afternoon_in_at_minutes(self) -> int:
        return parse_hhmm_to_minutes(self.lunch_break_end, DEFAULT_LUNCH_BREAK_END)

    @property
    def check_out_at_minutes(self) -> int:
        return parse_hhmm_to_minutes(self.check_out_end, DEFAULT_CHECK_OUT_END)

    @property
    def break_start_minutes(self) -> int:
        return self.lunch_out_at_minutes

    @property
    def break_end_minutes(self) -> int:
        return self.afternoon_in_at_minutes

    def _slot_end_minutes(self, earlier: int, later: int) -> int:
        """Halfway to the next punch, plus the column-assignment grace."""
        return (earlier + later) // 2 + self.slot_grace_minutes

    @property
    def check_in_until_minutes(self) -> int:
        return self._slot_end_minutes(self.check_in_at_minutes, self.lunch_out_at_minutes)

    @property
    def lunch_out_until_minutes(self) -> int:
        return self._slot_end_minutes(self.lunch_out_at_minutes, self.afternoon_in_at_minutes)

    @property
    def afternoon_in_until_minutes(self) -> int:
        return self._slot_end_minutes(self.afternoon_in_at_minutes, self.check_out_at_minutes)

    def is_online_day(self, date_str: str) -> bool:
        return weekday_code_for_date(date_str) in self.online_days

    def is_working_day(self, date_str: str) -> bool:
        return weekday_code_for_date(date_str) in self.working_days

    def punch_slot(self, timestamp: datetime) -> str:
        minutes = wall_clock_minutes(timestamp)
        if minutes < self.check_in_until_minutes:
            return 'check_in'
        if minutes < self.lunch_out_until_minutes:
            return 'lunch_out'
        if minutes < self.afternoon_in_until_minutes:
            return 'afternoon_in'
        return 'check_out'

    def timing_from_punches(
        self,
        check_in: Optional[datetime],
        afternoon_in: Optional[datetime],
        *,
        skip_penalties: bool = False,
    ) -> Dict[str, Any]:
        """
        Late and early vs expected morning start and afternoon return.

        On online days (skip_penalties=True), late/early are zeroed even if punches exist.
        """
        morning_late = 0
        afternoon_late = 0
        morning_early = 0
        afternoon_early = 0

        if not skip_penalties:
            if isinstance(check_in, datetime):
                delta = wall_clock_minutes(check_in) - self.check_in_at_minutes
                if delta > 0:
                    morning_late = delta
                elif delta < 0:
                    morning_early = -delta
            if isinstance(afternoon_in, datetime):
                delta = wall_clock_minutes(afternoon_in) - self.afternoon_in_at_minutes
                if delta > 0:
                    afternoon_late = delta
                elif delta < 0:
                    afternoon_early = -delta

        total_late = morning_late + afternoon_late
        total_early = morning_early + afternoon_early
        return {
            'morning_late_minutes': morning_late,
            'afternoon_late_minutes': afternoon_late,
            'total_late_minutes': total_late,
            'late_display': minutes_to_hhmm(total_late),
            'is_late': total_late > 0,
            'morning_early_minutes': morning_early,
            'afternoon_early_minutes': afternoon_early,
            'total_early_minutes': total_early,
            'early_display': minutes_to_hhmm(total_early),
            'is_early': total_early > 0,
        }

    def late_from_punches(
        self,
        check_in: Optional[datetime],
        afternoon_in: Optional[datetime],
    ) -> Dict[str, Any]:
        """Backward-compatible alias — returns late fields only. """
        timing = self.timing_from_punches(check_in, afternoon_in)
        return {
            'morning_late_minutes': timing['morning_late_minutes'],
            'afternoon_late_minutes': timing['afternoon_late_minutes'],
            'total_late_minutes': timing['total_late_minutes'],
            'late_display': timing['late_display'],
            'is_late': timing['is_late'],
        }

    def to_api_dict(self) -> Dict[str, Any]:
        return {
            'checkInStart': self.check_in_start,
            'lunchBreakStart': self.lunch_break_start,
            'lunchBreakEnd': self.lunch_break_end,
            'checkOutEnd': self.check_out_end,
            'slotGraceMinutes': self.slot_grace_minutes,
            'workingDays': list(self.working_days),
            'onlineDays': list(self.online_days),
        }

    @classmethod
    def from_settings(cls, settings: Optional[Dict[str, Any]]) -> 'WorkSchedule':
        if not settings:
            return cls()
        return cls(
            check_in_start=(
                settings.get('check_in_start')
                or settings.get('checkInStart')
                or DEFAULT_CHECK_IN_START
            ),
            lunch_break_start=(
                settings.get('lunch_break_start')
                or settings.get('lunchBreakStart')
                or DEFAULT_LUNCH_BREAK_START
            ),
            lunch_break_end=(
                settings.get('lunch_break_end')
                or settings.get('lunchBreakEnd')
                or DEFAULT_LUNCH_BREAK_END
            ),
            check_out_end=(
                settings.get('check_out_end')
                or settings.get('checkOutEnd')
                or DEFAULT_CHECK_OUT_END
            ),
            slot_grace_minutes=int(
                settings.get('slot_grace_minutes')
                or settings.get('slotGraceMinutes')
                or DEFAULT_SLOT_GRACE_MINUTES
            ),
            working_days=normalize_day_codes(
                settings.get('working_days', settings.get('workingDays')),
                DEFAULT_WORKING_DAYS,
            ),
            online_days=normalize_day_codes(
                settings['online_days']
                if 'online_days' in settings
                else (
                    settings['onlineDays']
                    if 'onlineDays' in settings
                    else None
                ),
                DEFAULT_ONLINE_DAYS,
                allow_empty=True,
            ),
        )


DEFAULT_SCHEDULE = WorkSchedule()


def get_work_schedule() -> WorkSchedule:
    """Load schedule from DB settings, falling back to company defaults."""
    try:
        from models.settings_model import get_settings

        settings = get_settings()
        if settings and isinstance(settings.get('attendance'), dict):
            return WorkSchedule.from_settings(settings['attendance'])
    except Exception as exc:
        logger.debug('Using default work schedule (%s)', exc)
    return DEFAULT_SCHEDULE


def empty_late_fields() -> Dict[str, Any]:
    return {
        'morning_late_minutes': 0,
        'afternoon_late_minutes': 0,
        'total_late_minutes': 0,
        'late_display': '00:00',
        'is_late': False,
        'morning_early_minutes': 0,
        'afternoon_early_minutes': 0,
        'total_early_minutes': 0,
        'early_display': '00:00',
        'is_early': False,
        'is_online_day': False,
    }
