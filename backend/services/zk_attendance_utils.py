"""
ZKTeco attendance helpers — event type resolution and timestamp handling.

On many ZKTeco terminals (including K80), the pyzk ``status`` field is the
verification method (fingerprint/card) and ``punch`` does not reliably encode
check-in vs check-out. When codes are ambiguous, we alternate per employee.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

# ZKTeco attendance state codes (when carried in status or punch)
_STATE_TO_EVENT = {
    0: 'check_in',
    1: 'check_out',
    2: 'check_out',   # break-out
    3: 'check_in',    # break-in
    4: 'check_in',    # OT-in
    5: 'check_out',   # OT-out
}

_STATE_LABELS = {
    0: 'Check-In',
    1: 'Check-Out',
    2: 'Break-Out',
    3: 'Break-In',
    4: 'OT-In',
    5: 'OT-Out',
}

# Values that clearly indicate verification method, not attendance state
_VERIFY_STATUS_VALUES = {1, 4, 15, 37, 101, 104}


def normalize_device_timestamp(value) -> datetime:
    """Keep device wall-clock time as naive datetime (no false UTC tagging)."""
    if isinstance(value, str):
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    elif isinstance(value, datetime):
        dt = value
    else:
        raise ValueError(f'Unsupported timestamp type: {type(value)}')

    if dt.tzinfo is not None:
        # Device encodes local time; drop tz marker without shifting hours
        dt = dt.replace(tzinfo=None)
    return dt.replace(microsecond=0)


def format_timestamp_for_api(value) -> str:
    """Serialize timestamp for API without timezone suffix."""
    if isinstance(value, str):
        return value.replace('Z', '').split('+')[0]
    if isinstance(value, datetime):
        if value.tzinfo is not None:
            value = value.replace(tzinfo=None)
        return value.isoformat()
    return str(value)


def _map_state_code(code: int) -> Optional[str]:
    if code in _STATE_TO_EVENT:
        return _STATE_TO_EVENT[code]
    return None


def resolve_event_type(
    status: int,
    punch: int,
    last_event: Optional[str] = None,
) -> Tuple[str, str]:
    """
    Resolve check_in / check_out from device fields.

    On K80 and similar terminals, ``status`` is the verification method
    (e.g. 1 = fingerprint) and ``punch`` does not encode in/out — the same
    punch code appears for morning and evening scans. In that case we derive
    in/out from chronological order (alternate per employee).

    Returns (event_type, resolution_method).
    """
    # Verification-only status — do NOT map punch codes (K80 uses punch=4 for all scans)
    if status in _VERIFY_STATUS_VALUES:
        if last_event == 'check_in':
            return 'check_out', 'alternate'
        return 'check_in', 'alternate'

    status_event = _map_state_code(status)
    if status_event:
        return status_event, 'status'

    punch_event = _map_state_code(punch)
    if punch_event:
        return punch_event, 'punch'

    if last_event == 'check_in':
        return 'check_out', 'alternate'
    return 'check_in', 'alternate'


def get_state_label(status: int, punch: int) -> str:
    if status in _STATE_LABELS:
        return _STATE_LABELS[status]
    if punch in _STATE_LABELS:
        return _STATE_LABELS[punch]
    return f'status={status},punch={punch}'


def employee_id_candidates(device_user_id: str) -> List[str]:
    """
    Build equivalent employee_id values for a ZKTeco badge/user_id.

    Handles legacy formats such as EMP001 vs EMP0001 for device user "1".
    """
    device_user_id = str(device_user_id).strip()
    if not device_user_id:
        return []

    candidates = [device_user_id, f'EMP{device_user_id}']
    if device_user_id.isdigit():
        number = int(device_user_id)
        candidates.extend([
            f'EMP{number:04d}',
            f'EMP{number:03d}',
            f'EMP{number}',
            str(number),
        ])
    else:
        upper = device_user_id.upper()
        if upper.startswith('EMP'):
            candidates.append(upper)

    seen = set()
    ordered: List[str] = []
    for candidate in candidates:
        if candidate and candidate not in seen:
            seen.add(candidate)
            ordered.append(candidate)
    return ordered


def pick_best_device_user_match(users: List[dict], device_user_id: str) -> Optional[dict]:
    """Prefer linked/admin accounts over auto-synced duplicates."""
    if not users:
        return None
    if len(users) == 1:
        return users[0]

    device_user_id = str(device_user_id).strip()

    for user in users:
        if str(user.get('device_user_id', '')).strip() == device_user_id:
            return user

    for user in users:
        if not user.get('synced_from_device') and user.get('role') in ('admin', 'supervisor', 'manager'):
            return user

    for user in users:
        if not user.get('synced_from_device'):
            return user

    return users[0]


def find_user_for_device_user_id(db, device_user_id: str) -> Optional[dict]:
    """Resolve the database user for a ZKTeco attendance log user_id."""
    device_user_id = str(device_user_id).strip()
    if not device_user_id:
        return None

    user = db.users.find_one({'device_user_id': device_user_id})
    if user:
        return user

    if device_user_id.isdigit():
        number = int(device_user_id)
        for biometric_id in (number, str(number)):
            user = db.users.find_one({'biometric_id': biometric_id})
            if user:
                return user

    matches: List[dict] = []
    seen_ids = set()
    for employee_id in employee_id_candidates(device_user_id):
        user = db.users.find_one({'employee_id': employee_id})
        if user and user['_id'] not in seen_ids:
            seen_ids.add(user['_id'])
            matches.append(user)

    user = pick_best_device_user_match(matches, device_user_id)
    if user and not user.get('device_user_id'):
        db.users.update_one(
            {'_id': user['_id']},
            {'$set': {'device_user_id': device_user_id}},
        )
        user['device_user_id'] = device_user_id
    return user


def resolve_attendance_employee_id(db, user: Optional[dict]) -> Optional[str]:
    """Return the employee_id that should be used for attendance lookups."""
    if not user:
        return None

    employee_id = user.get('employee_id')
    if not employee_id:
        return None

    if user.get('device_user_id'):
        return employee_id

    if user.get('biometric_id') is not None:
        linked = db.users.find_one({
            'biometric_id': user['biometric_id'],
            'device_user_id': {'$exists': True, '$ne': ''},
        })
        if linked:
            return linked.get('employee_id')

    numeric = str(employee_id).upper().removeprefix('EMP')
    if numeric.isdigit():
        linked = find_user_for_device_user_id(db, numeric)
        if linked:
            return linked.get('employee_id')

    return employee_id
