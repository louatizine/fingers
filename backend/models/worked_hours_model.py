"""Worked hours entries with mission lookup and extras calculation."""
from datetime import datetime

from bson.objectid import ObjectId
from pymongo.errors import DuplicateKeyError

from database import get_db
from models.fleet_client_model import get_client
from services.attendance_service import get_attendance_settings
from services.work_schedule import WorkSchedule

MISSION_STATUSES = {'reserved', 'active', 'returned'}
EDITABLE_STATUSES = {'draft', 'submitted', 'rejected'}


def _serialize(doc):
    if not doc:
        return None
    doc = dict(doc)
    doc['_id'] = str(doc['_id'])
    for key in ('createdAt', 'updatedAt', 'deletedAt', 'reviewedAt'):
        if isinstance(doc.get(key), datetime):
            doc[key] = doc[key].isoformat()
    return doc


def standard_daily_hours_for_date(date_str, schedule=None):
    """Return company standard hours for a date (0 on non-working days)."""
    schedule = schedule or WorkSchedule.from_settings(get_attendance_settings() or {})
    if not schedule.is_working_day(date_str):
        return 0.0
    morning = max(0, schedule.lunch_out_at_minutes - schedule.check_in_at_minutes)
    afternoon = max(0, schedule.check_out_at_minutes - schedule.afternoon_in_at_minutes)
    return round((morning + afternoon) / 60.0, 2)


def compute_extra_hours(total_hours, standard_hours):
    return round(max(0.0, float(total_hours) - float(standard_hours)), 2)


def find_mission_for_date(company_id, driver_id, date_str):
    """Find the assignment covering a driver on a specific date, with client."""
    query = {
        'companyId': company_id,
        'driverId': str(driver_id),
        'deletedAt': None,
        'status': {'$in': list(MISSION_STATUSES)},
        'startDate': {'$lte': date_str},
        '$or': [{'endDate': None}, {'endDate': {'$gte': date_str}}],
    }
    assignment = get_db().fleet_assignments.find_one(query, sort=[('startDate', -1)])
    if not assignment:
        return None
    assignment = _serialize(assignment)
    client = None
    if assignment.get('clientId'):
        client = get_client(assignment['clientId'], company_id)
    vehicle = None
    driver = None
    try:
        if assignment.get('vehicleId') and ObjectId.is_valid(assignment['vehicleId']):
            vehicle_doc = get_db().fleet_vehicles.find_one({
                '_id': ObjectId(assignment['vehicleId']),
                'companyId': company_id,
            })
            if vehicle_doc:
                vehicle = {
                    '_id': str(vehicle_doc['_id']),
                    'plateNumber': vehicle_doc.get('plateNumber'),
                    'brand': vehicle_doc.get('brand'),
                    'model': vehicle_doc.get('model'),
                }
        if assignment.get('driverId') and ObjectId.is_valid(assignment['driverId']):
            driver_doc = get_db().fleet_driver_profiles.find_one({
                '_id': ObjectId(assignment['driverId']),
                'companyId': company_id,
            })
            if driver_doc:
                driver = {
                    '_id': str(driver_doc['_id']),
                    'firstName': driver_doc.get('firstName'),
                    'lastName': driver_doc.get('lastName'),
                }
    except Exception:
        pass
    assignment['vehicle'] = vehicle
    assignment['driver'] = driver
    assignment['client'] = client
    return assignment


def _enrich_entry(entry, company_id):
    if not entry:
        return None
    entry = _serialize(entry)
    if entry.get('clientId'):
        entry['client'] = get_client(entry['clientId'], company_id)
    else:
        entry['client'] = None
    driver = None
    assignment = None
    try:
        if entry.get('driverId') and ObjectId.is_valid(entry['driverId']):
            driver_doc = get_db().fleet_driver_profiles.find_one({
                '_id': ObjectId(entry['driverId']),
                'companyId': company_id,
            })
            if driver_doc:
                driver = {
                    '_id': str(driver_doc['_id']),
                    'firstName': driver_doc.get('firstName'),
                    'lastName': driver_doc.get('lastName'),
                }
        if entry.get('assignmentId') and ObjectId.is_valid(entry['assignmentId']):
            assignment_doc = get_db().fleet_assignments.find_one({
                '_id': ObjectId(entry['assignmentId']),
                'companyId': company_id,
            })
            if assignment_doc:
                assignment = {
                    '_id': str(assignment_doc['_id']),
                    'purpose': assignment_doc.get('purpose'),
                    'startDate': assignment_doc.get('startDate'),
                    'endDate': assignment_doc.get('endDate'),
                    'status': assignment_doc.get('status'),
                    'vehicleId': str(assignment_doc['vehicleId']) if assignment_doc.get('vehicleId') else None,
                }
    except Exception:
        pass
    entry['driver'] = driver
    entry['assignment'] = assignment
    return entry


def list_entries(company_id, *, driver_id=None, client_id=None, status=None,
                 date_from=None, date_to=None, skip=0, limit=100):
    query = {'companyId': company_id, 'deletedAt': None}
    if driver_id:
        query['driverId'] = str(driver_id)
    if client_id:
        query['clientId'] = str(client_id)
    if status:
        query['status'] = status
    if date_from or date_to:
        query['date'] = {}
        if date_from:
            query['date']['$gte'] = date_from
        if date_to:
            query['date']['$lte'] = date_to
    docs = (
        get_db()
        .worked_hour_entries.find(query)
        .sort('date', -1)
        .skip(skip)
        .limit(limit)
    )
    return [_enrich_entry(doc, company_id) for doc in docs]


def count_entries(company_id, *, driver_id=None, client_id=None, status=None,
                  date_from=None, date_to=None):
    query = {'companyId': company_id, 'deletedAt': None}
    if driver_id:
        query['driverId'] = str(driver_id)
    if client_id:
        query['clientId'] = str(client_id)
    if status:
        query['status'] = status
    if date_from or date_to:
        query['date'] = {}
        if date_from:
            query['date']['$gte'] = date_from
        if date_to:
            query['date']['$lte'] = date_to
    return get_db().worked_hour_entries.count_documents(query)


def get_entry(entry_id, company_id=None):
    try:
        query = {'_id': ObjectId(entry_id), 'deletedAt': None}
    except Exception:
        return None
    if company_id:
        query['companyId'] = company_id
    doc = get_db().worked_hour_entries.find_one(query)
    if not doc:
        return None
    return _enrich_entry(doc, doc.get('companyId') or company_id)


def create_entry(data, actor_id):
    company_id = data['companyId']
    driver_id = str(data['driverId'])
    date_str = str(data['date']).strip()
    total_hours = float(data['totalHours'])
    if total_hours < 0 or total_hours > 24:
        raise ValueError('totalHours must be between 0 and 24')

    driver = get_db().fleet_driver_profiles.find_one({
        '_id': ObjectId(driver_id),
        'companyId': company_id,
        'deletedAt': None,
    })
    if not driver:
        raise ValueError('Driver not found')

    schedule = WorkSchedule.from_settings(get_attendance_settings() or {})
    standard_hours = standard_daily_hours_for_date(date_str, schedule)
    extra_hours = compute_extra_hours(total_hours, standard_hours)

    mission = find_mission_for_date(company_id, driver_id, date_str)
    assignment_id = mission['_id'] if mission else None
    client_id = mission.get('clientId') if mission else None
    if not assignment_id and data.get('clientId'):
        client = get_client(data['clientId'], company_id)
        if not client:
            raise ValueError('Client not found')
        client_id = client['_id']

    status = data.get('status') or 'submitted'
    if status not in {'draft', 'submitted'}:
        status = 'submitted'

    now = datetime.utcnow()
    document = {
        'companyId': company_id,
        'driverId': driver_id,
        'date': date_str,
        'totalHours': round(total_hours, 2),
        'standardHours': standard_hours,
        'extraHours': extra_hours,
        'assignmentId': assignment_id,
        'clientId': client_id,
        'notes': str(data.get('notes') or '').strip() or None,
        'attachment': data.get('attachment'),
        'status': status,
        'reviewedBy': None,
        'reviewedAt': None,
        'reviewNote': None,
        'createdBy': actor_id,
        'createdAt': now,
        'updatedAt': now,
        'deletedAt': None,
    }
    try:
        result = get_db().worked_hour_entries.insert_one(document)
    except DuplicateKeyError:
        raise ValueError('An entry already exists for this driver and date')
    return get_entry(str(result.inserted_id), company_id)


def update_entry(entry_id, data, company_id, *, allow_status_override=False):
    existing = get_entry(entry_id, company_id)
    if not existing:
        return None
    if existing.get('status') not in EDITABLE_STATUSES and not allow_status_override:
        raise ValueError('Approved entries cannot be edited')

    update = {'updatedAt': datetime.utcnow()}
    date_str = data.get('date') or existing['date']
    driver_id = str(data.get('driverId') or existing['driverId'])
    total_hours = float(data['totalHours']) if 'totalHours' in data else float(existing['totalHours'])
    if total_hours < 0 or total_hours > 24:
        raise ValueError('totalHours must be between 0 and 24')

    schedule = WorkSchedule.from_settings(get_attendance_settings() or {})
    standard_hours = standard_daily_hours_for_date(date_str, schedule)
    update['date'] = date_str
    update['driverId'] = driver_id
    update['totalHours'] = round(total_hours, 2)
    update['standardHours'] = standard_hours
    update['extraHours'] = compute_extra_hours(total_hours, standard_hours)

    mission = find_mission_for_date(company_id, driver_id, date_str)
    if mission:
        update['assignmentId'] = mission['_id']
        update['clientId'] = mission.get('clientId')
    else:
        update['assignmentId'] = None
        if 'clientId' in data:
            if data.get('clientId'):
                client = get_client(data['clientId'], company_id)
                if not client:
                    raise ValueError('Client not found')
                update['clientId'] = client['_id']
            else:
                update['clientId'] = None

    if 'notes' in data:
        update['notes'] = str(data.get('notes') or '').strip() or None
    if 'attachment' in data:
        update['attachment'] = data.get('attachment')
    if 'status' in data and data['status'] in {'draft', 'submitted'}:
        update['status'] = data['status']
        if data['status'] == 'submitted':
            update['reviewedBy'] = None
            update['reviewedAt'] = None
            update['reviewNote'] = None

    get_db().worked_hour_entries.update_one(
        {'_id': ObjectId(entry_id), 'companyId': company_id},
        {'$set': update},
    )
    return get_entry(entry_id, company_id)


def set_entry_status(entry_id, company_id, status, actor_id, review_note=None):
    existing = get_entry(entry_id, company_id)
    if not existing:
        return None
    if status not in {'approved', 'rejected', 'submitted'}:
        raise ValueError('Invalid status')
    if existing.get('status') == 'approved' and status != 'approved':
        pass
    update = {
        'status': status,
        'reviewedBy': actor_id,
        'reviewedAt': datetime.utcnow(),
        'reviewNote': str(review_note or '').strip() or None,
        'updatedAt': datetime.utcnow(),
    }
    get_db().worked_hour_entries.update_one(
        {'_id': ObjectId(entry_id), 'companyId': company_id},
        {'$set': update},
    )
    return get_entry(entry_id, company_id)


def soft_delete_entry(entry_id, company_id):
    existing = get_entry(entry_id, company_id)
    if not existing:
        return False
    get_db().worked_hour_entries.update_one(
        {'_id': ObjectId(entry_id), 'companyId': company_id},
        {'$set': {'deletedAt': datetime.utcnow(), 'updatedAt': datetime.utcnow()}},
    )
    return True
