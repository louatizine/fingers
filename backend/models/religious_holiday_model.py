"""
Religious holiday model — lunar / faith-based days planned per year.
"""
from datetime import datetime, timedelta
from bson import ObjectId
from database import db
import logging

logger = logging.getLogger(__name__)


def _serialize(doc):
    if not doc:
        return None
    doc['_id'] = str(doc['_id'])
    if doc.get('created_by'):
        doc['created_by'] = str(doc['created_by'])
    return doc


def _date_range(start_date, end_date):
    start = datetime.strptime(start_date, '%Y-%m-%d').date()
    end = datetime.strptime(end_date or start_date, '%Y-%m-%d').date()
    if end < start:
        start, end = end, start
    days = []
    current = start
    while current <= end:
        days.append(current.strftime('%Y-%m-%d'))
        current += timedelta(days=1)
    return days


def get_religious_holidays_by_year(year):
    try:
        cursor = db.religious_holidays.find({'year': int(year)}).sort('start_date', 1)
        return [_serialize(doc) for doc in cursor]
    except Exception as e:
        logger.error(f"Error getting religious holidays: {e}")
        return []


def get_religious_holiday_by_id(holiday_id):
    try:
        doc = db.religious_holidays.find_one({'_id': ObjectId(holiday_id)})
        return _serialize(doc)
    except Exception as e:
        logger.error(f"Error getting religious holiday: {e}")
        return None


def create_religious_holiday(data, created_by):
    try:
        start_date = data['start_date']
        end_date = data.get('end_date') or start_date
        year = int(data.get('year') or start_date[:4])

        payload = {
            'name': data['name'].strip(),
            'local_name': (data.get('local_name') or '').strip(),
            'preset_key': data.get('preset_key') or 'custom',
            'year': year,
            'start_date': start_date,
            'end_date': end_date,
            'notes': (data.get('notes') or '').strip(),
            'created_by': ObjectId(created_by) if created_by else None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
        }

        result = db.religious_holidays.insert_one(payload)
        payload['_id'] = str(result.inserted_id)
        if payload.get('created_by'):
            payload['created_by'] = str(payload['created_by'])
        return payload
    except Exception as e:
        logger.error(f"Error creating religious holiday: {e}")
        return None


def update_religious_holiday(holiday_id, data):
    try:
        updates = {'updated_at': datetime.utcnow()}

        if 'name' in data:
            updates['name'] = data['name'].strip()
        if 'local_name' in data:
            updates['local_name'] = (data.get('local_name') or '').strip()
        if 'preset_key' in data:
            updates['preset_key'] = data.get('preset_key') or 'custom'
        if 'start_date' in data:
            updates['start_date'] = data['start_date']
        if 'end_date' in data:
            updates['end_date'] = data['end_date'] or data['start_date']
        if 'notes' in data:
            updates['notes'] = (data.get('notes') or '').strip()
        if 'year' in data:
            updates['year'] = int(data['year'])
        elif 'start_date' in data:
            updates['year'] = int(data['start_date'][:4])

        db.religious_holidays.update_one(
            {'_id': ObjectId(holiday_id)},
            {'$set': updates},
        )
        return get_religious_holiday_by_id(holiday_id)
    except Exception as e:
        logger.error(f"Error updating religious holiday: {e}")
        return None


def delete_religious_holiday(holiday_id):
    try:
        result = db.religious_holidays.delete_one({'_id': ObjectId(holiday_id)})
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Error deleting religious holiday: {e}")
        return False


def expand_religious_holiday_days(holiday):
    """Expand a stored holiday into per-day entries for calendar rendering."""
    days = _date_range(holiday['start_date'], holiday.get('end_date'))
    return [
        {
            'id': holiday['_id'],
            'date': day,
            'name': holiday['name'],
            'local_name': holiday.get('local_name', ''),
            'preset_key': holiday.get('preset_key', 'custom'),
            'notes': holiday.get('notes', ''),
            'type': 'religious',
        }
        for day in days
    ]
