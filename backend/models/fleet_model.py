"""Fleet Phase 1 MongoDB operations."""
from calendar import monthrange
from datetime import date, datetime, timedelta
from threading import RLock

from bson.objectid import ObjectId
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from database import get_db

_assignment_lock = RLock()
ACTIVE_ASSIGNMENT_STATUSES = {'reserved', 'active'}
TRUCK_LICENSE_CATEGORIES = {'C', 'C1', 'CE', 'C1E'}
_fuel_lock = RLock()


def _id(value):
    return str(value)


def _serialize(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: _serialize(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_serialize(item) for item in value]
    return value


def _doc(collection, value, company_id):
    try:
        doc = get_db()[collection].find_one({'_id': ObjectId(value), 'companyId': company_id, 'deletedAt': None})
    except Exception:
        return None
    return _serialize(doc) if doc else None


def list_documents(collection, company_id, query=None, skip=0, limit=20, sort_field='createdAt', direction=-1):
    filters = {'companyId': company_id, 'deletedAt': None}
    filters.update(query or {})
    docs = get_db()[collection].find(filters).sort(sort_field, direction).skip(skip).limit(limit)
    return [_serialize(doc) for doc in docs]


def count_documents(collection, company_id, query=None):
    filters = {'companyId': company_id, 'deletedAt': None}
    filters.update(query or {})
    return get_db()[collection].count_documents(filters)


def get_vehicle(vehicle_id, company_id):
    return _doc('fleet_vehicles', vehicle_id, company_id)


def get_driver(driver_id, company_id):
    return _doc('fleet_driver_profiles', driver_id, company_id)


def get_assignment(assignment_id, company_id):
    return _doc('fleet_assignments', assignment_id, company_id)


def get_document(document_id, company_id):
    return _doc('fleet_vehicle_documents', document_id, company_id)


def write_audit(company_id, actor_id, action, entity_type, entity_id, before=None, after=None):
    get_db().fleet_audit_logs.insert_one({
        'companyId': company_id,
        'actorId': actor_id,
        'action': action,
        'entityType': entity_type,
        'entityId': str(entity_id),
        'before': before,
        'after': after,
        'createdAt': datetime.utcnow(),
    })


def _overlap_query(resource_field, resource_id, start_date, end_date):
    return {
        resource_field: resource_id,
        'status': {'$in': list(ACTIVE_ASSIGNMENT_STATUSES)},
        'deletedAt': None,
        'startDate': {'$lt': end_date or '9999-12-31'},
        '$or': [{'endDate': None}, {'endDate': {'$gt': start_date}}],
    }


def create_assignment(data, company_id, actor_id):
    db = get_db()
    with _assignment_lock:
        vehicle = db.fleet_vehicles.find_one({
            '_id': ObjectId(data['vehicleId']), 'companyId': company_id, 'deletedAt': None,
        })
        driver = db.fleet_driver_profiles.find_one({
            '_id': ObjectId(data['driverId']), 'companyId': company_id, 'deletedAt': None,
        })
        if not vehicle or not driver:
            return None, 'Vehicle or driver not found'
        if vehicle.get('status') in {'maintenance', 'out_of_service'}:
            return None, 'Vehicle is not available for assignment'
        if driver_license_status(driver) == 'expired':
            return None, 'Driver license is expired'
        end_date = data.get('endDate')
        expiry = (driver.get('license') or {}).get('expiryDate')
        if expiry and (not end_date or expiry < end_date):
            return None, 'Driver license expires before the assignment ends'
        if vehicle.get('vehicleType') == 'truck':
            categories = set((driver.get('license') or {}).get('categories') or [])
            if not categories.intersection(TRUCK_LICENSE_CATEGORIES):
                return None, 'Driver does not have a heavy-vehicle license'
        required_documents = {'insurance', 'technical_inspection'}
        documents = db.fleet_vehicle_documents.find({
            'companyId': company_id,
            'vehicleId': data['vehicleId'],
            'type': {'$in': list(required_documents)},
            'deletedAt': None,
        })
        valid_documents = {
            document['type'] for document in documents
            if document.get('expiryDate', '') >= data['startDate']
            and (not end_date or document.get('expiryDate', '') >= end_date)
        }
        missing_documents = required_documents - valid_documents
        if missing_documents:
            return None, 'Vehicle insurance and technical inspection must be valid'
        assignment_query = {'companyId': company_id}
        vehicle_conflict = db.fleet_assignments.find_one({
            **assignment_query, **_overlap_query('vehicleId', data['vehicleId'], data['startDate'], end_date),
        })
        driver_conflict = db.fleet_assignments.find_one({
            **assignment_query, **_overlap_query('driverId', data['driverId'], data['startDate'], end_date),
        })
        if vehicle_conflict:
            return None, 'Vehicle is already assigned during this period'
        if driver_conflict:
            return None, 'Driver is already assigned during this period'
        now = datetime.utcnow()
        document = {
            'companyId': company_id,
            'vehicleId': data['vehicleId'],
            'driverId': data['driverId'],
            'startDate': data['startDate'],
            'endDate': end_date,
            'purpose': data.get('purpose'),
            'status': 'reserved',
            'checkOut': None,
            'checkIn': None,
            'createdBy': actor_id,
            'createdAt': now,
            'updatedAt': now,
            'deletedAt': None,
        }
        try:
            result = db.fleet_assignments.insert_one(document)
        except DuplicateKeyError:
            return None, 'Vehicle is already actively assigned'
        write_audit(company_id, actor_id, 'assignment.created', 'assignment', result.inserted_id, after=_serialize(document))
        return _serialize(document | {'_id': result.inserted_id}), None


def driver_license_status(driver, today=None):
    expiry = (driver.get('license') or {}).get('expiryDate')
    if not expiry:
        return 'expired'
    current = today or date.today().isoformat()
    if expiry < current:
        return 'expired'
    threshold = date.fromisoformat(current).toordinal() + 30
    return 'expiring' if date.fromisoformat(expiry).toordinal() <= threshold else 'valid'


def set_assignment_status(assignment_id, company_id, actor_id, action, payload):
    db = get_db()
    with _assignment_lock:
        assignment = db.fleet_assignments.find_one({
            '_id': ObjectId(assignment_id), 'companyId': company_id, 'deletedAt': None,
        })
        if not assignment:
            return None, 'Assignment not found'
        before = _serialize(assignment)
        vehicle_filter = {'_id': ObjectId(assignment['vehicleId']), 'companyId': company_id, 'deletedAt': None}
        if action == 'checkout':
            if assignment['status'] != 'reserved':
                return None, 'Only reserved assignments can be checked out'
            update = {
                'status': 'active',
                'checkOut': {
                    'mileage': payload.get('mileage'),
                    'fuelLevel': payload.get('fuelLevel'),
                    'conditionNotes': payload.get('conditionNotes'),
                    'photoPaths': payload.get('photoPaths', []),
                    'timestamp': datetime.utcnow(),
                    'user': actor_id,
                },
            }
            vehicle_update = {'status': 'assigned'}
        elif action == 'checkin':
            if assignment['status'] != 'active':
                return None, 'Only active assignments can be checked in'
            checkout_mileage = (assignment.get('checkOut') or {}).get('mileage')
            mileage = payload.get('mileage')
            if mileage is None or checkout_mileage is None or float(mileage) < float(checkout_mileage):
                return None, 'Check-in mileage must be greater than or equal to check-out mileage'
            update = {
                'status': 'returned',
                'checkIn': {
                    'mileage': mileage,
                    'fuelLevel': payload.get('fuelLevel'),
                    'conditionNotes': payload.get('conditionNotes'),
                    'photoPaths': payload.get('photoPaths', []),
                    'timestamp': datetime.utcnow(),
                    'user': actor_id,
                },
            }
            vehicle_update = {'status': 'available', 'currentMileage': float(mileage)}
        else:
            return None, 'Unsupported assignment action'
        now = datetime.utcnow()
        update['updatedAt'] = now
        db.fleet_assignments.update_one({'_id': assignment['_id'], 'status': assignment['status']}, {'$set': update})
        db.fleet_vehicles.update_one(vehicle_filter, {'$set': vehicle_update})
        updated = db.fleet_assignments.find_one({'_id': assignment['_id']})
        write_audit(company_id, actor_id, f'assignment.{action}', 'assignment', assignment_id, before=before, after=_serialize(updated))
        return _serialize(updated), None


def period_key(value, period):
    current = date.fromisoformat(value)
    if period == 'day':
        return current.isoformat()
    if period == 'week':
        start = current - timedelta(days=current.weekday())
        return start.isoformat()
    if period == 'month':
        return current.strftime('%Y-%m')
    raise ValueError('Invalid fuel limit period')


def fuel_limit_query(company_id, driver_id, vehicle_id, purchase_date):
    return {
        'companyId': company_id,
        'driverId': driver_id,
        '$and': [
            {'$or': [{'vehicleId': None}, {'vehicleId': vehicle_id}]},
            {'$or': [{'effectiveTo': None}, {'effectiveTo': {'$gte': purchase_date}}]},
        ],
        'effectiveFrom': {'$lte': purchase_date},
        'deletedAt': None,
    }


def fuel_limit_remaining(company_id, driver_id, vehicle_id, purchase_date):
    db = get_db()
    limits = list(db.fleet_fuel_limits.find(fuel_limit_query(company_id, driver_id, vehicle_id, purchase_date)))
    if not limits:
        return []
    results = []
    for limit in limits:
        key = period_key(purchase_date, limit['period'])
        total = db.fleet_fuel_period_totals.find_one({
            'companyId': company_id, 'driverId': driver_id, 'vehicleId': vehicle_id,
            'periodKey': key, 'limitId': str(limit['_id']),
        }) or {}
        results.append({
            'limitId': str(limit['_id']),
            'period': limit['period'],
            'limitType': limit['limitType'],
            'limitAmount': limit['limitAmount'],
            'spent': total.get('spent', 0),
            'remaining': max(0, limit['limitAmount'] - total.get('spent', 0)),
        })
    return results


def reserve_fuel_limit(company_id, driver_id, vehicle_id, purchase_date, amount, liters):
    db = get_db()
    reservations = []
    with _fuel_lock:
        limits = list(db.fleet_fuel_limits.find(fuel_limit_query(company_id, driver_id, vehicle_id, purchase_date)))
        if not limits:
            return None, 'No fuel limit is configured for this driver'
        for limit in limits:
            value = amount if limit['limitType'] == 'money' else liters
            key = period_key(purchase_date, limit['period'])
            total_filter = {
                'companyId': company_id, 'driverId': driver_id, 'vehicleId': vehicle_id,
                'periodKey': key, 'limitId': str(limit['_id']),
            }
            db.fleet_fuel_period_totals.update_one(
                total_filter, {'$setOnInsert': {**total_filter, 'spent': 0}}, upsert=True,
            )
            updated = db.fleet_fuel_period_totals.find_one_and_update(
                {**total_filter, 'spent': {'$lte': limit['limitAmount'] - value}},
                {'$inc': {'spent': value}},
                return_document=ReturnDocument.AFTER,
            )
            if not updated:
                for reservation in reservations:
                    db.fleet_fuel_period_totals.update_one(
                        {'_id': reservation['_id']}, {'$inc': {'spent': -reservation['value']}},
                    )
                return None, 'Fuel limit exceeded'
            reservations.append({'_id': updated['_id'], 'value': value})
    return reservations, None


def release_fuel_reservations(reservations):
    db = get_db()
    for reservation in reservations or []:
        db.fleet_fuel_period_totals.update_one(
            {'_id': reservation['_id']}, {'$inc': {'spent': -reservation['value']},
        })
