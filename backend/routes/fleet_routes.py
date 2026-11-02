"""Fleet Management Phase 1 API."""
from datetime import datetime, timedelta
import hashlib
from bson.objectid import ObjectId
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from pymongo.errors import DuplicateKeyError

from database import get_db
from models.fleet_client_model import (
    create_client,
    delete_client,
    get_client,
    list_clients,
    update_client,
)
from models.fleet_model import (
    count_documents,
    create_assignment,
    driver_license_status,
    get_assignment,
    get_document,
    fuel_limit_remaining,
    release_fuel_reservations,
    reserve_fuel_limit,
    get_driver,
    get_vehicle,
    list_documents,
    set_assignment_status,
    write_audit,
)
from storage.fleet_storage import FleetStorage, FleetStorageError
from utils.fleet_permissions import (
    current_fleet_user,
    fleet_company_id,
    fleet_manager_required,
    fleet_read_required,
)
from utils.auth_utils import admin_required

fleet_bp = Blueprint('fleet', __name__)
storage = FleetStorage()


def _json_or_form():
    return request.form.to_dict() if request.content_type and request.content_type.startswith('multipart/form-data') else (request.get_json() or {})


def _pagination():
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 20))))
    except ValueError:
        page, limit = 1, 20
    return page, limit


def _upload_files(category, field='photos'):
    results = []
    for uploaded in request.files.getlist(field):
        results.append(storage.save(uploaded, category))
    return results


def _receipt_hash(uploaded):
    if not uploaded or not uploaded.filename:
        return None
    content = uploaded.read()
    uploaded.seek(0)
    return hashlib.sha256(content).hexdigest()


def _driver_for_current_user(user):
    return get_db().fleet_driver_profiles.find_one({
        'companyId': fleet_company_id(user),
        'userId': str(user['_id']),
        'deletedAt': None,
    })


def _company_query(user):
    return {'companyId': fleet_company_id(user)}


def _abnormal_consumption_percent(company_id):
    setting = get_db().fleet_settings.find_one({
        'companyId': company_id,
        'key': 'abnormalConsumptionPercent',
    })
    return float(setting.get('value', 30)) if setting else 30.0


def _vehicle_label(vehicle):
    if not vehicle:
        return None
    return {
        '_id': vehicle.get('_id'),
        'plateNumber': vehicle.get('plateNumber'),
        'brand': vehicle.get('brand'),
        'model': vehicle.get('model'),
        'status': vehicle.get('status'),
        'currentMileage': vehicle.get('currentMileage'),
    }


def _driver_label(driver):
    if not driver:
        return None
    return {
        '_id': driver.get('_id'),
        'firstName': driver.get('firstName'),
        'lastName': driver.get('lastName'),
        'phone': driver.get('phone'),
        'licenseStatus': driver_license_status(driver) if driver.get('license') else None,
    }


def _client_label(client):
    if not client:
        return None
    return {
        '_id': client.get('_id'),
        'name': client.get('name'),
        'code': client.get('code'),
    }


def _enrich_with_labels(items, company_id, vehicle_key='vehicleId', driver_key='driverId', client_key='clientId'):
    db = get_db()
    vehicle_ids = {item.get(vehicle_key) for item in items if vehicle_key and item.get(vehicle_key)}
    driver_ids = {item.get(driver_key) for item in items if driver_key and item.get(driver_key)}
    client_ids = {item.get(client_key) for item in items if client_key and item.get(client_key)}
    vehicles = {}
    drivers = {}
    clients = {}
    for vehicle_id in vehicle_ids:
        if ObjectId.is_valid(vehicle_id):
            doc = db.fleet_vehicles.find_one({'_id': ObjectId(vehicle_id), 'companyId': company_id})
            if doc:
                doc['_id'] = str(doc['_id'])
                vehicles[vehicle_id] = _vehicle_label(doc)
    for driver_id in driver_ids:
        if ObjectId.is_valid(driver_id):
            doc = db.fleet_driver_profiles.find_one({'_id': ObjectId(driver_id), 'companyId': company_id})
            if doc:
                doc['_id'] = str(doc['_id'])
                drivers[driver_id] = _driver_label(doc)
    for client_id in client_ids:
        if ObjectId.is_valid(client_id):
            doc = db.fleet_clients.find_one({'_id': ObjectId(client_id), 'companyId': company_id})
            if doc:
                doc['_id'] = str(doc['_id'])
                clients[client_id] = _client_label(doc)
    for item in items:
        if vehicle_key:
            item['vehicle'] = vehicles.get(item.get(vehicle_key))
        if driver_key:
            item['driver'] = drivers.get(item.get(driver_key))
        if client_key:
            item['client'] = clients.get(item.get(client_key))
    return items


@fleet_bp.route('/clients', methods=['GET'])
@jwt_required()
@fleet_read_required
def list_fleet_clients():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    active_only = request.args.get('activeOnly', '').lower() in {'1', 'true', 'yes'}
    clients = list_clients(company_id, active_only=active_only)
    return jsonify({'clients': clients}), 200


@fleet_bp.route('/clients/<client_id>', methods=['GET'])
@jwt_required()
@fleet_read_required
def get_fleet_client(client_id):
    user = current_fleet_user()
    client = get_client(client_id, fleet_company_id(user))
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    return jsonify({'client': client}), 200


@fleet_bp.route('/clients', methods=['POST'])
@jwt_required()
@fleet_manager_required
def create_fleet_client():
    user = current_fleet_user()
    data = request.get_json() or {}
    try:
        client = create_client({**data, 'companyId': fleet_company_id(user)}, get_jwt_identity())
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    write_audit(fleet_company_id(user), get_jwt_identity(), 'client.created', 'client', client['_id'], after=client)
    return jsonify({'client': client}), 201


@fleet_bp.route('/clients/<client_id>', methods=['PUT'])
@jwt_required()
@fleet_manager_required
def update_fleet_client(client_id):
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    before = get_client(client_id, company_id)
    if not before:
        return jsonify({'error': 'Client not found'}), 404
    try:
        client = update_client(client_id, request.get_json() or {}, company_id)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    write_audit(company_id, get_jwt_identity(), 'client.updated', 'client', client_id, before=before, after=client)
    return jsonify({'client': client}), 200


@fleet_bp.route('/clients/<client_id>', methods=['DELETE'])
@jwt_required()
@fleet_manager_required
def delete_fleet_client(client_id):
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    before = get_client(client_id, company_id)
    if not delete_client(client_id, company_id):
        return jsonify({'error': 'Client not found'}), 404
    write_audit(company_id, get_jwt_identity(), 'client.deleted', 'client', client_id, before=before)
    return jsonify({'message': 'Client archived'}), 200


@fleet_bp.route('/vehicles', methods=['GET'])
@jwt_required()
@fleet_read_required
def list_vehicles():
    user = current_fleet_user()
    query = _company_query(user)
    if user.get('role') == 'employee':
        vehicle_ids = get_db().fleet_assignments.distinct(
            'vehicleId',
            {'companyId': fleet_company_id(user), 'driverId': _driver_id_for_user(user), 'deletedAt': None},
        )
        query['_id'] = {'$in': [ObjectId(value) for value in vehicle_ids if ObjectId.is_valid(value)]}
    search = request.args.get('search', '').strip()
    if search:
        query['$or'] = [
            {'plateNumber': {'$regex': search, '$options': 'i'}},
            {'brand': {'$regex': search, '$options': 'i'}},
            {'model': {'$regex': search, '$options': 'i'}},
        ]
    for key in ('status', 'fuelType', 'departmentId'):
        if request.args.get(key):
            query[key] = request.args[key]
    page, limit = _pagination()
    sort = request.args.get('sort', 'createdAt')
    direction = -1 if request.args.get('order', 'desc').lower() != 'asc' else 1
    total = count_documents('fleet_vehicles', fleet_company_id(user), query)
    return jsonify({'vehicles': list_documents('fleet_vehicles', fleet_company_id(user), query, (page - 1) * limit, limit, sort, direction),
                    'pagination': {'page': page, 'limit': limit, 'total': total, 'pages': (total + limit - 1) // limit}}), 200


@fleet_bp.route('/vehicles', methods=['POST'])
@jwt_required()
@fleet_manager_required
def create_vehicle():
    user = current_fleet_user()
    data = _json_or_form()
    plate = str(data.get('plateNumber', '')).strip().upper()
    if not plate or not data.get('brand') or not data.get('model'):
        return jsonify({'error': 'plateNumber, brand, and model are required'}), 400
    vehicle_type = data.get('vehicleType') or 'car'
    if vehicle_type not in {'car', 'van', 'truck'}:
        return jsonify({'error': 'Invalid vehicle type'}), 400
    status = data.get('status') or 'available'
    if status == 'in_maintenance':
        status = 'maintenance'
    if status not in {'available', 'assigned', 'maintenance', 'retired', 'out_of_service'}:
        return jsonify({'error': 'Invalid vehicle status'}), 400
    now = datetime.utcnow()
    vehicle = {
        'companyId': fleet_company_id(user),
        'departmentId': data.get('departmentId') or None,
        'plateNumber': plate,
        'vehicleType': vehicle_type,
        'vin': str(data.get('vin', '')).strip().upper() or None,
        'chassisNumber': str(data.get('chassisNumber', '')).strip().upper() or None,
        'brand': str(data['brand']).strip(),
        'model': str(data['model']).strip(),
        'year': int(data['year']) if data.get('year') else None,
        'color': data.get('color') or None,
        'fuelType': data.get('fuelType') or 'other',
        'transmission': data.get('transmission') or 'other',
        'currentMileage': float(data.get('currentMileage') or 0),
        'tankCapacityLiters': float(data.get('tankCapacityLiters') or 0),
        'payloadCapacityKg': float(data['payloadCapacityKg']) if data.get('payloadCapacityKg') else None,
        'grossWeightKg': float(data['grossWeightKg']) if data.get('grossWeightKg') else None,
        'purchaseDate': data.get('purchaseDate') or None,
        'purchasePrice': float(data['purchasePrice']) if data.get('purchasePrice') else None,
        'status': status,
        'photos': _upload_files('vehicles'),
        'notes': data.get('notes') or None,
        'createdBy': get_jwt_identity(),
        'createdAt': now,
        'updatedAt': now,
        'deletedAt': None,
    }
    try:
        result = get_db().fleet_vehicles.insert_one(vehicle)
    except (DuplicateKeyError, ValueError):
        return jsonify({'error': 'Plate number or VIN already exists'}), 409
    write_audit(fleet_company_id(user), get_jwt_identity(), 'vehicle.created', 'vehicle', result.inserted_id, after=vehicle)
    vehicle['_id'] = str(result.inserted_id)
    return jsonify({'vehicle': vehicle}), 201


@fleet_bp.route('/vehicles/<vehicle_id>', methods=['GET'])
@jwt_required()
@fleet_read_required
def get_vehicle_route(vehicle_id):
    user = current_fleet_user()
    vehicle = get_vehicle(vehicle_id, fleet_company_id(user))
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    if user.get('role') == 'employee' and not _employee_can_view_vehicle(user, vehicle_id):
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'vehicle': vehicle}), 200


@fleet_bp.route('/vehicles/<vehicle_id>/history', methods=['GET'])
@jwt_required()
@fleet_read_required
def vehicle_history(vehicle_id):
    user = current_fleet_user()
    vehicle = get_vehicle(vehicle_id, fleet_company_id(user))
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    if user.get('role') == 'employee' and not _employee_can_view_vehicle(user, vehicle_id):
        return jsonify({'error': 'Unauthorized'}), 403
    company_id = fleet_company_id(user)
    assignments = _enrich_with_labels(
        list_documents('fleet_assignments', company_id, {'vehicleId': vehicle_id}, 0, 1000, 'startDate', -1),
        company_id,
    )
    audit_logs = list(get_db().fleet_audit_logs.find(
        {'companyId': company_id, 'entityType': 'vehicle', 'entityId': vehicle_id},
    ).sort('createdAt', -1).limit(100))
    for log in audit_logs:
        log['_id'] = str(log['_id'])
    return jsonify({'assignments': assignments, 'auditLogs': audit_logs}), 200


@fleet_bp.route('/vehicles/<vehicle_id>/photos/<stored_name>', methods=['GET'])
@jwt_required()
@fleet_read_required
def vehicle_photo(vehicle_id, stored_name):
    user = current_fleet_user()
    vehicle = get_vehicle(vehicle_id, fleet_company_id(user))
    if not vehicle or (user.get('role') == 'employee' and not _employee_can_view_vehicle(user, vehicle_id)):
        return jsonify({'error': 'Unauthorized'}), 403
    if not any(photo.get('storedName') == stored_name for photo in vehicle.get('photos', [])):
        return jsonify({'error': 'Photo not found'}), 404
    try:
        return send_file(storage.get_path(stored_name, 'vehicles'))
    except FleetStorageError:
        return jsonify({'error': 'Photo not found'}), 404


@fleet_bp.route('/vehicles/<vehicle_id>', methods=['PUT'])
@jwt_required()
@fleet_manager_required
def update_vehicle(vehicle_id):
    user = current_fleet_user()
    existing = get_vehicle(vehicle_id, fleet_company_id(user))
    if not existing:
        return jsonify({'error': 'Vehicle not found'}), 404
    data = _json_or_form()
    allowed = {'departmentId', 'plateNumber', 'vehicleType', 'vin', 'brand', 'model', 'year', 'color', 'fuelType',
               'transmission', 'currentMileage', 'tankCapacityLiters', 'payloadCapacityKg', 'grossWeightKg',
               'chassisNumber', 'purchaseDate', 'purchasePrice', 'status', 'notes'}
    update = {key: value for key, value in data.items() if key in allowed}
    if 'plateNumber' in update:
        update['plateNumber'] = str(update['plateNumber']).strip().upper()
    if 'vin' in update:
        update['vin'] = str(update['vin']).strip().upper() or None
    if update.get('status') == 'in_maintenance':
        update['status'] = 'maintenance'
    if 'status' in update and update['status'] not in {'available', 'assigned', 'maintenance', 'retired', 'out_of_service'}:
        return jsonify({'error': 'Invalid vehicle status'}), 400
    if 'currentMileage' in update:
        update['currentMileage'] = float(update['currentMileage'])
    if request.files.getlist('photos'):
        update['photos'] = existing.get('photos', []) + _upload_files('vehicles')
    update['updatedAt'] = datetime.utcnow()
    try:
        get_db().fleet_vehicles.update_one({'_id': ObjectId(vehicle_id), 'companyId': fleet_company_id(user), 'deletedAt': None}, {'$set': update})
    except (DuplicateKeyError, ValueError):
        return jsonify({'error': 'Plate number or VIN already exists'}), 409
    write_audit(fleet_company_id(user), get_jwt_identity(), 'vehicle.updated', 'vehicle', vehicle_id, before=existing, after={**existing, **update})
    return jsonify({'vehicle': get_vehicle(vehicle_id, fleet_company_id(user))}), 200


@fleet_bp.route('/vehicles/<vehicle_id>', methods=['DELETE'])
@jwt_required()
@fleet_manager_required
def delete_vehicle(vehicle_id):
    user = current_fleet_user()
    vehicle = get_vehicle(vehicle_id, fleet_company_id(user))
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    if get_db().fleet_assignments.count_documents({'companyId': fleet_company_id(user), 'vehicleId': vehicle_id, 'deletedAt': None}) > 0:
        get_db().fleet_vehicles.update_one({'_id': ObjectId(vehicle_id)}, {'$set': {'status': 'out_of_service', 'deletedAt': datetime.utcnow()}})
    else:
        get_db().fleet_vehicles.update_one({'_id': ObjectId(vehicle_id)}, {'$set': {'deletedAt': datetime.utcnow(), 'status': 'out_of_service'}})
    write_audit(fleet_company_id(user), get_jwt_identity(), 'vehicle.deleted', 'vehicle', vehicle_id, before=vehicle)
    return jsonify({'message': 'Vehicle archived'}), 200


@fleet_bp.route('/drivers', methods=['GET'])
@jwt_required()
@fleet_manager_required
def list_drivers():
    user = current_fleet_user()
    query = {}
    if request.args.get('search'):
        value = request.args['search']
        query['$or'] = [{'firstName': {'$regex': value, '$options': 'i'}}, {'lastName': {'$regex': value, '$options': 'i'}}, {'employeeId': {'$regex': value, '$options': 'i'}}]
    page, limit = _pagination()
    drivers = list_documents('fleet_driver_profiles', fleet_company_id(user), query, (page - 1) * limit, limit)
    for driver in drivers:
        driver['licenseStatus'] = driver_license_status(driver)
    total = count_documents('fleet_driver_profiles', fleet_company_id(user), query)
    return jsonify({'drivers': drivers, 'pagination': {'page': page, 'limit': limit, 'total': total, 'pages': (total + limit - 1) // limit}}), 200


@fleet_bp.route('/drivers', methods=['POST'])
@jwt_required()
@fleet_manager_required
def create_driver():
    user = current_fleet_user()
    data = _json_or_form()
    required = ('firstName', 'lastName', 'licenseNumber', 'licenseExpiryDate')
    if any(not str(data.get(key, '')).strip() for key in required):
        return jsonify({'error': 'Driver name and license fields are required'}), 400
    categories = data.get('licenseCategories') or data.get('licenseCategory') or ''
    categories = [item.strip().upper() for item in categories.split(',') if item.strip()]
    if not categories:
        return jsonify({'error': 'At least one license category is required'}), 400
    now = datetime.utcnow()
    driver = {
        'companyId': fleet_company_id(user),
        'firstName': str(data['firstName']).strip(), 'lastName': str(data['lastName']).strip(),
        'phone': data.get('phone') or None, 'email': data.get('email') or None,
        'employeeId': data.get('employeeId') or None, 'departmentId': data.get('departmentId') or None,
        'license': {'number': str(data['licenseNumber']).strip(), 'categories': categories,
                    'issueDate': data.get('licenseIssueDate') or None, 'expiryDate': data['licenseExpiryDate'],
                    'file': storage.save(request.files['licenseFile'], 'licenses') if request.files.get('licenseFile') else None},
        'isActive': True, 'notes': data.get('notes') or None, 'createdBy': get_jwt_identity(),
        'createdAt': now, 'updatedAt': now, 'deletedAt': None,
    }
    if data.get('userId'):
        driver['userId'] = data['userId']
    try:
        result = get_db().fleet_driver_profiles.insert_one(driver)
    except DuplicateKeyError:
        return jsonify({'error': 'A driver profile already exists for this account'}), 409
    driver['_id'] = str(result.inserted_id)
    driver['licenseStatus'] = driver_license_status(driver)
    write_audit(fleet_company_id(user), get_jwt_identity(), 'driver.created', 'driver', result.inserted_id, after=driver)
    return jsonify({'driver': driver}), 201


@fleet_bp.route('/drivers/<driver_id>', methods=['PUT'])
@jwt_required()
@fleet_manager_required
def update_driver(driver_id):
    user = current_fleet_user()
    existing = get_driver(driver_id, fleet_company_id(user))
    if not existing:
        return jsonify({'error': 'Driver not found'}), 404
    data = _json_or_form()
    fields = {'firstName', 'lastName', 'phone', 'email', 'employeeId', 'departmentId', 'notes'}
    update = {key: value for key, value in data.items() if key in fields}
    license_update = existing.get('license', {}).copy()
    mapping = {
        'licenseNumber': 'number',
        'licenseCategories': 'categories',
        'licenseIssueDate': 'issueDate',
        'licenseExpiryDate': 'expiryDate',
    }
    for source, target in mapping.items():
        if source in data:
            license_update[target] = (
                [item.strip().upper() for item in data[source].split(',') if item.strip()]
                if target == 'categories' else data[source]
            )
    if request.files.get('licenseFile'):
        license_update['file'] = storage.save(request.files['licenseFile'], 'licenses')
    if any(key in data for key in mapping) or request.files.get('licenseFile'):
        update['license'] = license_update
    update['updatedAt'] = datetime.utcnow()
    get_db().fleet_driver_profiles.update_one(
        {'_id': ObjectId(driver_id), 'companyId': fleet_company_id(user), 'deletedAt': None},
        {'$set': update},
    )
    after = get_driver(driver_id, fleet_company_id(user))
    after['licenseStatus'] = driver_license_status(after)
    write_audit(fleet_company_id(user), get_jwt_identity(), 'driver.updated', 'driver', driver_id, before=existing, after=after)
    return jsonify({'driver': after}), 200


@fleet_bp.route('/drivers/<driver_id>', methods=['DELETE'])
@jwt_required()
@fleet_manager_required
def delete_driver(driver_id):
    user = current_fleet_user()
    driver = get_driver(driver_id, fleet_company_id(user))
    if not driver:
        return jsonify({'error': 'Driver not found'}), 404
    if get_db().fleet_assignments.count_documents({
        'companyId': fleet_company_id(user), 'driverId': driver_id, 'deletedAt': None,
    }) > 0:
        return jsonify({'error': 'Drivers with assignment history cannot be deleted'}), 409
    get_db().fleet_driver_profiles.update_one(
        {'_id': ObjectId(driver_id), 'companyId': fleet_company_id(user), 'deletedAt': None},
        {'$set': {'deletedAt': datetime.utcnow(), 'isActive': False, 'updatedAt': datetime.utcnow()}},
    )
    write_audit(fleet_company_id(user), get_jwt_identity(), 'driver.deleted', 'driver', driver_id, before=driver)
    return jsonify({'message': 'Driver archived'}), 200


@fleet_bp.route('/drivers/<driver_id>', methods=['GET'])
@jwt_required()
@fleet_read_required
def get_driver_route(driver_id):
    user = current_fleet_user()
    driver = get_driver(driver_id, fleet_company_id(user))
    if not driver:
        return jsonify({'error': 'Driver not found'}), 404
    if user.get('role') == 'employee' and driver.get('userId') != get_jwt_identity():
        return jsonify({'error': 'Unauthorized'}), 403
    driver['licenseStatus'] = driver_license_status(driver)
    return jsonify({'driver': driver}), 200


@fleet_bp.route('/drivers/<driver_id>/license/file', methods=['GET'])
@jwt_required()
@fleet_read_required
def driver_license_file(driver_id):
    user = current_fleet_user()
    driver = get_driver(driver_id, fleet_company_id(user))
    if not driver or (user.get('role') == 'employee' and driver.get('userId') != get_jwt_identity()):
        return jsonify({'error': 'Unauthorized'}), 403
    license_file = (driver.get('license') or {}).get('file')
    if not license_file:
        return jsonify({'error': 'License file not found'}), 404
    try:
        return send_file(storage.get_path(license_file['storedName'], 'licenses'))
    except FleetStorageError:
        return jsonify({'error': 'License file not found'}), 404


@fleet_bp.route('/vehicles/<vehicle_id>/documents', methods=['GET'])
@jwt_required()
@fleet_read_required
def list_vehicle_documents(vehicle_id):
    user = current_fleet_user()
    vehicle = get_vehicle(vehicle_id, fleet_company_id(user))
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    if user.get('role') == 'employee' and not _employee_can_view_vehicle(user, vehicle_id):
        return jsonify({'error': 'Unauthorized'}), 403
    documents = list_documents(
        'fleet_vehicle_documents',
        fleet_company_id(user),
        {'vehicleId': vehicle_id},
        0,
        100,
        'expiryDate',
        1,
    )
    today = datetime.utcnow().date().isoformat()
    for document in documents:
        expiry = document.get('expiryDate', '')
        document['status'] = 'expired' if expiry < today else (
            'expiring' if expiry <= (datetime.utcnow().date() + timedelta(days=30)).isoformat() else 'valid'
        )
    return jsonify({'documents': documents}), 200


@fleet_bp.route('/vehicles/<vehicle_id>/documents', methods=['POST'])
@jwt_required()
@fleet_manager_required
def create_vehicle_document(vehicle_id):
    user = current_fleet_user()
    if not get_vehicle(vehicle_id, fleet_company_id(user)):
        return jsonify({'error': 'Vehicle not found'}), 404
    data = _json_or_form()
    required = ('type', 'issueDate', 'expiryDate')
    if any(not str(data.get(key, '')).strip() for key in required):
        return jsonify({'error': 'Document type, issue date, and expiry date are required'}), 400
    if data['type'] not in {'insurance', 'technical_inspection', 'registration', 'other'}:
        return jsonify({'error': 'Invalid document type'}), 400
    try:
        file_data = storage.save(request.files['file'], 'documents') if request.files.get('file') else None
    except FleetStorageError as error:
        return jsonify({'error': str(error)}), 400
    document = {
        'companyId': fleet_company_id(user),
        'vehicleId': vehicle_id,
        'type': data['type'],
        'documentNumber': data.get('documentNumber') or None,
        'issueDate': data['issueDate'],
        'expiryDate': data['expiryDate'],
        'provider': data.get('provider') or None,
        'cost': float(data['cost']) if data.get('cost') else None,
        'file': file_data,
        'createdBy': get_jwt_identity(),
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow(),
        'deletedAt': None,
    }
    result = get_db().fleet_vehicle_documents.insert_one(document)
    document['_id'] = str(result.inserted_id)
    write_audit(fleet_company_id(user), get_jwt_identity(), 'vehicle_document.created', 'vehicle_document', result.inserted_id, after=document)
    return jsonify({'document': document}), 201


@fleet_bp.route('/documents/<document_id>', methods=['GET'])
@jwt_required()
@fleet_read_required
def get_vehicle_document(document_id):
    user = current_fleet_user()
    document = get_document(document_id, fleet_company_id(user))
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    if user.get('role') == 'employee' and not _employee_can_view_vehicle(user, document['vehicleId']):
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'document': document}), 200


@fleet_bp.route('/documents/<document_id>/file', methods=['GET'])
@jwt_required()
@fleet_read_required
def vehicle_document_file(document_id):
    user = current_fleet_user()
    document = get_document(document_id, fleet_company_id(user))
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    if user.get('role') == 'employee' and not _employee_can_view_vehicle(user, document['vehicleId']):
        return jsonify({'error': 'Unauthorized'}), 403
    file_data = document.get('file')
    if not file_data:
        return jsonify({'error': 'Document file not found'}), 404
    try:
        return send_file(storage.get_path(file_data['storedName'], 'documents'))
    except FleetStorageError:
        return jsonify({'error': 'Document file not found'}), 404


@fleet_bp.route('/documents/<document_id>', methods=['PUT'])
@jwt_required()
@fleet_manager_required
def update_vehicle_document(document_id):
    user = current_fleet_user()
    document = get_document(document_id, fleet_company_id(user))
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    data = _json_or_form()
    update = {key: data[key] for key in ('type', 'documentNumber', 'issueDate', 'expiryDate', 'provider') if key in data}
    if 'cost' in data:
        update['cost'] = float(data['cost']) if data['cost'] else None
    if request.files.get('file'):
        try:
            update['file'] = storage.save(request.files['file'], 'documents')
        except FleetStorageError as error:
            return jsonify({'error': str(error)}), 400
    update['updatedAt'] = datetime.utcnow()
    get_db().fleet_vehicle_documents.update_one(
        {'_id': ObjectId(document_id), 'companyId': fleet_company_id(user), 'deletedAt': None},
        {'$set': update},
    )
    after = get_document(document_id, fleet_company_id(user))
    write_audit(fleet_company_id(user), get_jwt_identity(), 'vehicle_document.updated', 'vehicle_document', document_id, before=document, after=after)
    return jsonify({'document': after}), 200


@fleet_bp.route('/documents/<document_id>', methods=['DELETE'])
@jwt_required()
@fleet_manager_required
def delete_vehicle_document(document_id):
    user = current_fleet_user()
    document = get_document(document_id, fleet_company_id(user))
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    get_db().fleet_vehicle_documents.update_one(
        {'_id': ObjectId(document_id), 'companyId': fleet_company_id(user), 'deletedAt': None},
        {'$set': {'deletedAt': datetime.utcnow(), 'updatedAt': datetime.utcnow()}},
    )
    write_audit(fleet_company_id(user), get_jwt_identity(), 'vehicle_document.deleted', 'vehicle_document', document_id, before=document)
    return jsonify({'message': 'Document archived'}), 200


@fleet_bp.route('/assignments', methods=['GET'])
@jwt_required()
@fleet_manager_required
def list_assignments():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    query = {}
    for key in ('vehicleId', 'driverId', 'status'):
        if request.args.get(key):
            query[key] = request.args[key]
    page, limit = _pagination()
    total = count_documents('fleet_assignments', company_id, query)
    assignments = _enrich_with_labels(
        list_documents('fleet_assignments', company_id, query, (page - 1) * limit, limit),
        company_id,
    )
    return jsonify({'assignments': assignments,
                    'pagination': {'page': page, 'limit': limit, 'total': total, 'pages': (total + limit - 1) // limit}}), 200


@fleet_bp.route('/assignments/mine', methods=['GET'])
@jwt_required()
def my_assignments():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    driver_id = _driver_id_for_user(user)
    if not driver_id:
        return jsonify({'assignments': [], 'pagination': {'page': 1, 'limit': 20, 'total': 0, 'pages': 0}}), 200
    page, limit = _pagination()
    query = {'driverId': driver_id}
    total = count_documents('fleet_assignments', company_id, query)
    assignments = _enrich_with_labels(
        list_documents('fleet_assignments', company_id, query, (page - 1) * limit, limit),
        company_id,
    )
    return jsonify({'assignments': assignments,
                    'pagination': {'page': page, 'limit': limit, 'total': total, 'pages': (total + limit - 1) // limit}}), 200


@fleet_bp.route('/assignments', methods=['POST'])
@jwt_required()
@fleet_manager_required
def create_assignment_route():
    user = current_fleet_user()
    data = request.get_json() or {}
    for key in ('vehicleId', 'driverId', 'startDate'):
        if not data.get(key):
            return jsonify({'error': f'{key} is required'}), 400
    assignment, error = create_assignment(data, fleet_company_id(user), get_jwt_identity())
    return (jsonify({'error': error}), 409) if error else (jsonify({'assignment': assignment}), 201)


@fleet_bp.route('/assignments/<assignment_id>', methods=['GET'])
@jwt_required()
def get_assignment_route(assignment_id):
    user = current_fleet_user()
    assignment = get_assignment(assignment_id, fleet_company_id(user))
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    if user.get('role') == 'employee' and assignment.get('driverId') != _driver_id_for_user(user):
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'assignment': assignment}), 200


@fleet_bp.route('/assignments/<assignment_id>', methods=['PUT'])
@jwt_required()
@fleet_manager_required
def update_assignment(assignment_id):
    user = current_fleet_user()
    assignment = get_assignment(assignment_id, fleet_company_id(user))
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    if assignment.get('status') in {'active', 'returned'}:
        return jsonify({'error': 'Checked-out or returned assignments cannot be edited'}), 400
    data = request.get_json() or {}
    update = {key: data[key] for key in ('startDate', 'endDate', 'purpose') if key in data}
    if 'clientId' in data:
        client_id = data.get('clientId') or None
        if client_id:
            client = get_client(client_id, fleet_company_id(user))
            if not client:
                return jsonify({'error': 'Client not found'}), 400
            update['clientId'] = client['_id']
        else:
            update['clientId'] = None
    if not update:
        return jsonify({'error': 'No editable fields supplied'}), 400
    update['updatedAt'] = datetime.utcnow()
    get_db().fleet_assignments.update_one({'_id': ObjectId(assignment_id), 'companyId': fleet_company_id(user)}, {'$set': update})
    return jsonify({'assignment': get_assignment(assignment_id, fleet_company_id(user))}), 200


@fleet_bp.route('/assignments/<assignment_id>', methods=['DELETE'])
@jwt_required()
@fleet_manager_required
def delete_assignment(assignment_id):
    user = current_fleet_user()
    assignment = get_assignment(assignment_id, fleet_company_id(user))
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    if assignment.get('status') in {'active', 'returned'}:
        return jsonify({'error': 'Active or returned assignments cannot be deleted'}), 400
    get_db().fleet_assignments.update_one(
        {'_id': ObjectId(assignment_id), 'companyId': fleet_company_id(user)},
        {'$set': {'deletedAt': datetime.utcnow(), 'status': 'cancelled', 'updatedAt': datetime.utcnow()}},
    )
    write_audit(fleet_company_id(user), get_jwt_identity(), 'assignment.deleted', 'assignment', assignment_id, before=assignment)
    return jsonify({'message': 'Assignment archived'}), 200


@fleet_bp.route('/assignments/<assignment_id>/checkout', methods=['POST'])
@jwt_required()
def checkout_assignment(assignment_id):
    return _assignment_action(assignment_id, 'checkout')


@fleet_bp.route('/assignments/<assignment_id>/checkin', methods=['POST'])
@jwt_required()
def checkin_assignment(assignment_id):
    return _assignment_action(assignment_id, 'checkin')


@fleet_bp.route('/assignments/<assignment_id>/cancel', methods=['POST'])
@jwt_required()
@fleet_manager_required
def cancel_assignment(assignment_id):
    user = current_fleet_user()
    assignment = get_assignment(assignment_id, fleet_company_id(user))
    if not assignment or assignment.get('status') in {'active', 'returned'}:
        return jsonify({'error': 'Assignment cannot be cancelled'}), 400
    get_db().fleet_assignments.update_one({'_id': ObjectId(assignment_id), 'companyId': fleet_company_id(user)}, {'$set': {'status': 'cancelled', 'updatedAt': datetime.utcnow()}})
    write_audit(fleet_company_id(user), get_jwt_identity(), 'assignment.cancelled', 'assignment', assignment_id, before=assignment)
    return jsonify({'message': 'Assignment cancelled'}), 200


def _assignment_action(assignment_id, action):
    user = current_fleet_user()
    assignment = get_assignment(assignment_id, fleet_company_id(user))
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    if user.get('role') == 'employee' and assignment.get('driverId') != _driver_id_for_user(user):
        return jsonify({'error': 'Unauthorized'}), 403
    data = _json_or_form()
    try:
        if action == 'checkout':
            payload = {'mileage': float(data['mileage']), 'fuelLevel': float(data['fuelLevel']) if data.get('fuelLevel') else None,
                       'conditionNotes': data.get('conditionNotes'), 'photoPaths': _upload_files('vehicles')}
        else:
            payload = {'mileage': float(data['mileage']), 'fuelLevel': float(data['fuelLevel']) if data.get('fuelLevel') else None,
                       'conditionNotes': data.get('conditionNotes'), 'photoPaths': _upload_files('vehicles')}
    except (KeyError, ValueError, FleetStorageError) as error:
        return jsonify({'error': str(error) or 'Mileage is required'}), 400
    updated, error = set_assignment_status(assignment_id, fleet_company_id(user), get_jwt_identity(), action, payload)
    return (jsonify({'error': error}), 400) if error else (jsonify({'assignment': updated}), 200)


def _driver_id_for_user(user):
    if not user:
        return None
    driver = get_db().fleet_driver_profiles.find_one({'companyId': fleet_company_id(user), 'userId': str(user['_id']), 'deletedAt': None})
    return str(driver['_id']) if driver else None


def _employee_can_view_vehicle(user, vehicle_id):
    driver_id = _driver_id_for_user(user)
    return bool(driver_id and get_db().fleet_assignments.find_one({
        'companyId': fleet_company_id(user), 'vehicleId': vehicle_id, 'driverId': driver_id, 'deletedAt': None,
    }))


@fleet_bp.route('/fuel/limits', methods=['GET'])
@jwt_required()
@fleet_manager_required
def list_fuel_limits():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    limits = _enrich_with_labels(
        list_documents('fleet_fuel_limits', company_id, {}, 0, 500, 'createdAt', -1),
        company_id,
    )
    return jsonify({'limits': limits}), 200


@fleet_bp.route('/fuel/limits', methods=['POST'])
@jwt_required()
@admin_required
def create_fuel_limit():
    user = current_fleet_user()
    data = request.get_json() or {}
    required = ('driverId', 'period', 'limitType', 'limitAmount', 'effectiveFrom')
    if any(not data.get(key) for key in required):
        return jsonify({'error': 'driverId, period, limitType, limitAmount, and effectiveFrom are required'}), 400
    if data['period'] not in {'day', 'week', 'month'} or data['limitType'] not in {'money', 'liters'}:
        return jsonify({'error': 'Invalid fuel limit period or type'}), 400
    driver = get_driver(data['driverId'], fleet_company_id(user))
    if not driver:
        return jsonify({'error': 'Driver not found'}), 404
    if data.get('vehicleId') and not get_vehicle(data['vehicleId'], fleet_company_id(user)):
        return jsonify({'error': 'Vehicle not found'}), 404
    document = {
        'companyId': fleet_company_id(user),
        'driverId': data['driverId'],
        'vehicleId': data.get('vehicleId') or None,
        'period': data['period'],
        'limitType': data['limitType'],
        'limitAmount': float(data['limitAmount']),
        'effectiveFrom': data['effectiveFrom'],
        'effectiveTo': data.get('effectiveTo'),
        'createdBy': get_jwt_identity(),
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow(),
        'deletedAt': None,
    }
    result = get_db().fleet_fuel_limits.insert_one(document)
    document['_id'] = str(result.inserted_id)
    write_audit(fleet_company_id(user), get_jwt_identity(), 'fuel_limit.created', 'fuel_limit', result.inserted_id, after=document)
    return jsonify({'limit': document}), 201


@fleet_bp.route('/fuel/limits/<limit_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_fuel_limit(limit_id):
    user = current_fleet_user()
    try:
        existing = get_db().fleet_fuel_limits.find_one({
            '_id': ObjectId(limit_id), 'companyId': fleet_company_id(user), 'deletedAt': None,
        })
    except Exception:
        existing = None
    if not existing:
        return jsonify({'error': 'Fuel limit not found'}), 404
    data = request.get_json() or {}
    update = {key: data[key] for key in ('period', 'limitType', 'effectiveFrom', 'effectiveTo') if key in data}
    if 'limitAmount' in data:
        update['limitAmount'] = float(data['limitAmount'])
    update['updatedAt'] = datetime.utcnow()
    get_db().fleet_fuel_limits.update_one({'_id': existing['_id']}, {'$set': update})
    after = get_db().fleet_fuel_limits.find_one({'_id': existing['_id']})
    write_audit(fleet_company_id(user), get_jwt_identity(), 'fuel_limit.updated', 'fuel_limit', limit_id, before=existing, after=after)
    return jsonify({'limit': after}), 200


@fleet_bp.route('/fuel/limits/<limit_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_fuel_limit(limit_id):
    user = current_fleet_user()
    result = get_db().fleet_fuel_limits.update_one(
        {'_id': ObjectId(limit_id), 'companyId': fleet_company_id(user), 'deletedAt': None},
        {'$set': {'deletedAt': datetime.utcnow(), 'updatedAt': datetime.utcnow()}},
    )
    if not result.matched_count:
        return jsonify({'error': 'Fuel limit not found'}), 404
    write_audit(fleet_company_id(user), get_jwt_identity(), 'fuel_limit.deleted', 'fuel_limit', limit_id)
    return jsonify({'message': 'Fuel limit deactivated'}), 200


@fleet_bp.route('/fuel/limits/mine', methods=['GET'])
@jwt_required()
def my_fuel_limits():
    user = current_fleet_user()
    driver_id = _driver_id_for_user(user)
    if not driver_id:
        return jsonify({'limits': []}), 200
    return jsonify({'limits': list_documents('fleet_fuel_limits', fleet_company_id(user), {'driverId': driver_id}, 0, 100, 'createdAt', -1)}), 200


@fleet_bp.route('/fuel/settings', methods=['GET', 'PUT'])
@jwt_required()
@admin_required
def fuel_settings():
    company_id = fleet_company_id(current_fleet_user())
    collection = get_db().fleet_settings
    if request.method == 'GET':
        setting = collection.find_one({'companyId': company_id, 'key': 'abnormalConsumptionPercent'})
        return jsonify({'abnormalConsumptionPercent': float(setting.get('value', 30)) if setting else 30.0}), 200
    data = request.get_json() or {}
    try:
        percentage = float(data.get('abnormalConsumptionPercent'))
    except (TypeError, ValueError):
        return jsonify({'error': 'abnormalConsumptionPercent must be a number'}), 400
    if percentage < 0 or percentage > 500:
        return jsonify({'error': 'abnormalConsumptionPercent must be between 0 and 500'}), 400
    collection.update_one(
        {'companyId': company_id, 'key': 'abnormalConsumptionPercent'},
        {'$set': {'value': percentage, 'updatedAt': datetime.utcnow(), 'updatedBy': get_jwt_identity()},
         '$setOnInsert': {'companyId': company_id, 'key': 'abnormalConsumptionPercent', 'createdAt': datetime.utcnow()}},
        upsert=True,
    )
    write_audit(company_id, get_jwt_identity(), 'fuel_settings.updated', 'fuel_settings', company_id,
                after={'abnormalConsumptionPercent': percentage})
    return jsonify({'abnormalConsumptionPercent': percentage}), 200


@fleet_bp.route('/fuel/purchases', methods=['GET'])
@jwt_required()
def list_fuel_purchases():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    query = {}
    if user.get('role') == 'employee':
        driver_id = _driver_id_for_user(user)
        if not driver_id:
            return jsonify({'purchases': []}), 200
        query['driverId'] = driver_id
    else:
        for key in ('driverId', 'vehicleId', 'status', 'flagged'):
            if request.args.get(key):
                query[key] = True if key == 'flagged' and request.args[key].lower() in {'1', 'true'} else request.args[key]
    purchases = _enrich_with_labels(
        list_documents('fleet_fuel_purchases', company_id, query, 0, 500, 'purchaseDate', -1),
        company_id,
    )
    return jsonify({'purchases': purchases}), 200


@fleet_bp.route('/fuel/purchases', methods=['POST'])
@jwt_required()
def create_fuel_purchase():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    data = _json_or_form()
    is_manager = user.get('role') in {'admin', 'supervisor'}
    if user.get('role') == 'employee':
        driver = _driver_for_current_user(user)
        if not driver:
            return jsonify({'error': 'Driver profile not found'}), 400
        driver_id = str(driver['_id'])
    elif is_manager:
        if not data.get('driverId'):
            return jsonify({'error': 'driverId is required when logging fuel for a driver'}), 400
        driver = get_driver(data['driverId'], company_id)
        if not driver:
            return jsonify({'error': 'Driver not found'}), 404
        driver_id = str(driver['_id'])
    else:
        return jsonify({'error': 'Unauthorized'}), 403
    required = ('vehicleId', 'purchaseDate', 'station', 'liters', 'pricePerLiter', 'mileageAtPump')
    if any(not data.get(key) for key in required):
        return jsonify({'error': 'Vehicle, date, station, liters, price, and mileage are required'}), 400
    vehicle = get_vehicle(data['vehicleId'], company_id)
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    if not is_manager:
        assignment = get_db().fleet_assignments.find_one({
            'companyId': company_id, 'vehicleId': data['vehicleId'],
            'driverId': driver_id, 'status': 'active', 'deletedAt': None,
            'startDate': {'$lte': data['purchaseDate']},
            '$or': [{'endDate': None}, {'endDate': {'$gte': data['purchaseDate']}}],
        })
        if not assignment:
            return jsonify({'error': 'Vehicle is not actively assigned to you on that date'}), 403
    liters = float(data['liters'])
    price = float(data['pricePerLiter'])
    total = round(liters * price, 2)
    mileage = float(data['mileageAtPump'])
    if liters <= 0 or price <= 0 or mileage < float(vehicle.get('currentMileage') or 0):
        return jsonify({'error': 'Invalid liters, price, or mileage'}), 400
    tank_capacity = float(vehicle.get('tankCapacityLiters') or 0)
    if tank_capacity and liters > tank_capacity:
        return jsonify({'error': 'Purchase exceeds the vehicle tank capacity'}), 400
    receipt = request.files.get('receipt')
    receipt_hash = _receipt_hash(receipt)
    if receipt_hash and get_db().fleet_fuel_purchases.find_one({'receiptHash': receipt_hash}):
        return jsonify({'error': 'This receipt has already been used'}), 409
    reservations, error = reserve_fuel_limit(
        company_id, driver_id, data['vehicleId'], data['purchaseDate'], total, liters,
    )
    if error:
        remaining = fuel_limit_remaining(company_id, driver_id, data['vehicleId'], data['purchaseDate'])
        return jsonify({'error': error, 'remaining': remaining}), 409
    file_data = None
    try:
        previous = get_db().fleet_fuel_purchases.find_one(
            {'companyId': company_id, 'vehicleId': data['vehicleId'], 'mileageAtPump': {'$lt': mileage}},
            sort=[('mileageAtPump', -1)],
        )
        flagged = False
        if previous and mileage > float(previous['mileageAtPump']):
            consumption = liters / (mileage - float(previous['mileageAtPump'])) * 100
            average = float(vehicle.get('normalConsumptionPer100Km') or 0)
            flagged = bool(average and consumption > average * (1 + _abnormal_consumption_percent(company_id) / 100))
        file_data = storage.save(receipt, 'invoices') if receipt else None
        document = {
            'companyId': company_id, 'vehicleId': data['vehicleId'],
            'driverId': driver_id, 'purchaseDate': data['purchaseDate'],
            'station': str(data['station']).strip(), 'liters': liters, 'pricePerLiter': price,
            'totalAmount': total, 'mileageAtPump': mileage, 'receipt': file_data,
            'receiptHash': receipt_hash, 'status': 'submitted' if receipt else 'pending_proof',
            'flagged': flagged, 'createdBy': get_jwt_identity(), 'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(), 'deletedAt': None, 'limitReservations': reservations,
            'loggedByManager': is_manager,
        }
        result = get_db().fleet_fuel_purchases.insert_one(document)
        get_db().fleet_vehicles.update_one(
            {'_id': ObjectId(data['vehicleId']), 'companyId': company_id},
            {'$set': {'currentMileage': mileage, 'updatedAt': datetime.utcnow()}},
        )
    except DuplicateKeyError:
        release_fuel_reservations(reservations)
        if file_data:
            storage.delete(file_data['storedName'], 'invoices')
        return jsonify({'error': 'This receipt has already been used'}), 409
    except Exception:
        release_fuel_reservations(reservations)
        raise
    document['_id'] = str(result.inserted_id)
    write_audit(company_id, get_jwt_identity(), 'fuel_purchase.created', 'fuel_purchase', result.inserted_id, after=document)
    return jsonify({'purchase': document}), 201


@fleet_bp.route('/fuel/purchases/<purchase_id>/receipt', methods=['POST'])
@jwt_required()
def attach_fuel_receipt(purchase_id):
    user = current_fleet_user()
    purchase = get_db().fleet_fuel_purchases.find_one({
        '_id': ObjectId(purchase_id), 'companyId': fleet_company_id(user), 'deletedAt': None,
    })
    if not purchase:
        return jsonify({'error': 'Fuel purchase not found'}), 404
    if user.get('role') == 'employee' and purchase.get('driverId') != _driver_id_for_user(user):
        return jsonify({'error': 'Unauthorized'}), 403
    if purchase.get('status') != 'pending_proof':
        return jsonify({'error': 'A receipt can only be attached to a purchase pending proof'}), 400
    receipt = request.files.get('receipt')
    if not receipt:
        return jsonify({'error': 'Receipt file is required'}), 400
    receipt_hash = _receipt_hash(receipt)
    if get_db().fleet_fuel_purchases.find_one({'receiptHash': receipt_hash, '_id': {'$ne': purchase['_id']}}):
        return jsonify({'error': 'This receipt has already been used'}), 409
    try:
        file_data = storage.save(receipt, 'invoices')
    except FleetStorageError as error:
        return jsonify({'error': str(error)}), 400
    get_db().fleet_fuel_purchases.update_one(
        {'_id': purchase['_id']}, {'$set': {'receipt': file_data, 'receiptHash': receipt_hash, 'status': 'submitted', 'updatedAt': datetime.utcnow()}},
    )
    return jsonify({'message': 'Receipt attached', 'status': 'submitted'}), 200


@fleet_bp.route('/fuel/purchases/<purchase_id>/validate', methods=['POST'])
@jwt_required()
@fleet_manager_required
def validate_fuel_purchase(purchase_id):
    user = current_fleet_user()
    return _review_fuel_purchase(purchase_id, user, 'validated', None)


@fleet_bp.route('/fuel/purchases/<purchase_id>/reject', methods=['POST'])
@jwt_required()
@fleet_manager_required
def reject_fuel_purchase(purchase_id):
    user = current_fleet_user()
    reason = (request.get_json() or {}).get('reason', '').strip()
    if not reason:
        return jsonify({'error': 'A rejection reason is required'}), 400
    return _review_fuel_purchase(purchase_id, user, 'rejected', reason)


def _review_fuel_purchase(purchase_id, user, status, reason):
    purchase = get_db().fleet_fuel_purchases.find_one({
        '_id': ObjectId(purchase_id), 'companyId': fleet_company_id(user), 'deletedAt': None,
    })
    if not purchase:
        return jsonify({'error': 'Fuel purchase not found'}), 404
    if purchase.get('status') in {'validated', 'rejected'}:
        return jsonify({'error': 'Fuel purchase already reviewed'}), 400
    if status == 'validated' and purchase.get('status') != 'submitted':
        return jsonify({'error': 'A receipt is required before validation'}), 400
    update = {'status': status, 'reviewedBy': get_jwt_identity(), 'reviewedAt': datetime.utcnow(), 'updatedAt': datetime.utcnow()}
    if reason:
        update['rejectionReason'] = reason
        release_fuel_reservations(purchase.get('limitReservations'))
    get_db().fleet_fuel_purchases.update_one({'_id': purchase['_id']}, {'$set': update})
    write_audit(fleet_company_id(user), get_jwt_identity(), f'fuel_purchase.{status}', 'fuel_purchase', purchase_id, before=purchase, after={**purchase, **update})
    return jsonify({'message': f'Fuel purchase {status}'}), 200


@fleet_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@fleet_read_required
def fleet_dashboard():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    db = get_db()
    today = datetime.utcnow().date()
    in_30 = (today + timedelta(days=30)).isoformat()
    today_iso = today.isoformat()
    month_prefix = today.strftime('%Y-%m')

    status_counts = {key: 0 for key in ('available', 'assigned', 'maintenance', 'out_of_service', 'retired')}
    for row in db.fleet_vehicles.aggregate([
        {'$match': {'companyId': company_id, 'deletedAt': None}},
        {'$group': {'_id': '$status', 'count': {'$sum': 1}}},
    ]):
        if row['_id'] in status_counts:
            status_counts[row['_id']] = row['count']

    active_assignments = db.fleet_assignments.count_documents({
        'companyId': company_id, 'deletedAt': None, 'status': {'$in': ['reserved', 'active']},
    })
    pending_fuel = db.fleet_fuel_purchases.count_documents({
        'companyId': company_id, 'deletedAt': None, 'status': {'$in': ['submitted', 'pending_proof']},
    })
    month_spend = 0.0
    for purchase in db.fleet_fuel_purchases.find({
        'companyId': company_id, 'deletedAt': None, 'purchaseDate': {'$regex': f'^{month_prefix}'},
        'status': {'$ne': 'rejected'},
    }, {'totalAmount': 1}):
        month_spend += float(purchase.get('totalAmount') or 0)

    expiring_licenses = []
    for driver in db.fleet_driver_profiles.find({'companyId': company_id, 'deletedAt': None}):
        status = driver_license_status(driver, today_iso)
        if status in {'expired', 'expiring'}:
            expiring_licenses.append({
                **_driver_label({**driver, '_id': str(driver['_id'])}),
                'licenseStatus': status,
                'expiryDate': (driver.get('license') or {}).get('expiryDate'),
            })

    expiring_documents = []
    for document in db.fleet_vehicle_documents.find({
        'companyId': company_id, 'deletedAt': None, 'expiryDate': {'$lte': in_30},
    }).limit(50):
        vehicle = get_vehicle(document['vehicleId'], company_id)
        expiring_documents.append({
            '_id': str(document['_id']),
            'type': document.get('type'),
            'expiryDate': document.get('expiryDate'),
            'status': 'expired' if document.get('expiryDate', '') < today_iso else 'expiring',
            'vehicle': _vehicle_label(vehicle),
        })

    due_maintenance = []
    for schedule in db.fleet_maintenance_schedules.find({
        'companyId': company_id, 'deletedAt': None,
        '$or': [
            {'nextDueDate': {'$lte': in_30}},
            {'nextDueMileage': {'$exists': True}},
        ],
    }).limit(50):
        vehicle = get_vehicle(schedule['vehicleId'], company_id)
        mileage_due = schedule.get('nextDueMileage')
        mileage_triggered = (
            vehicle and mileage_due is not None
            and float(vehicle.get('currentMileage') or 0) >= float(mileage_due)
        )
        date_triggered = schedule.get('nextDueDate') and schedule['nextDueDate'] <= in_30
        if not (mileage_triggered or date_triggered):
            continue
        due_maintenance.append({
            '_id': str(schedule['_id']),
            'type': schedule.get('type'),
            'nextDueDate': schedule.get('nextDueDate'),
            'nextDueMileage': schedule.get('nextDueMileage'),
            'vehicle': _vehicle_label(vehicle),
            'urgency': 'overdue' if (
                (schedule.get('nextDueDate') and schedule['nextDueDate'] < today_iso)
                or mileage_triggered
            ) else 'upcoming',
        })

    open_maintenance = db.fleet_maintenance_records.count_documents({
        'companyId': company_id, 'deletedAt': None, 'status': {'$in': ['planned', 'in_progress']},
    })

    return jsonify({
        'counts': {
            **status_counts,
            'totalVehicles': sum(status_counts.values()),
            'activeAssignments': active_assignments,
            'pendingFuel': pending_fuel,
            'openMaintenance': open_maintenance,
            'monthFuelSpend': round(month_spend, 2),
        },
        'alerts': {
            'expiringLicenses': expiring_licenses[:20],
            'expiringDocuments': expiring_documents[:20],
            'dueMaintenance': due_maintenance[:20],
        },
    }), 200


@fleet_bp.route('/maintenance/records', methods=['GET'])
@jwt_required()
@fleet_read_required
def list_maintenance_records():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    query = {}
    if request.args.get('vehicleId'):
        query['vehicleId'] = request.args['vehicleId']
    if request.args.get('status'):
        query['status'] = request.args['status']
    if user.get('role') == 'employee':
        vehicle_ids = get_db().fleet_assignments.distinct(
            'vehicleId',
            {'companyId': company_id, 'driverId': _driver_id_for_user(user), 'deletedAt': None},
        )
        query['vehicleId'] = {'$in': vehicle_ids} if not query.get('vehicleId') else query['vehicleId']
        if query.get('vehicleId') not in (None, '') and isinstance(query['vehicleId'], str):
            if query['vehicleId'] not in vehicle_ids:
                return jsonify({'records': []}), 200
    page, limit = _pagination()
    total = count_documents('fleet_maintenance_records', company_id, query)
    records = _enrich_with_labels(
        list_documents('fleet_maintenance_records', company_id, query, (page - 1) * limit, limit, 'serviceDate', -1),
        company_id,
        driver_key=None,
    )
    return jsonify({
        'records': records,
        'pagination': {'page': page, 'limit': limit, 'total': total, 'pages': (total + limit - 1) // limit or 0},
    }), 200


@fleet_bp.route('/maintenance/records', methods=['POST'])
@jwt_required()
@fleet_manager_required
def create_maintenance_record():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    data = _json_or_form()
    required = ('vehicleId', 'type', 'serviceDate')
    if any(not data.get(key) for key in required):
        return jsonify({'error': 'vehicleId, type, and serviceDate are required'}), 400
    if data['type'] not in {'service', 'repair', 'tires', 'inspection', 'other'}:
        return jsonify({'error': 'Invalid maintenance type'}), 400
    vehicle = get_vehicle(data['vehicleId'], company_id)
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    status = data.get('status') or 'planned'
    if status not in {'planned', 'in_progress', 'completed', 'cancelled'}:
        return jsonify({'error': 'Invalid maintenance status'}), 400
    try:
        invoice = storage.save(request.files['invoice'], 'maintenance') if request.files.get('invoice') else None
    except FleetStorageError as error:
        return jsonify({'error': str(error)}), 400
    now = datetime.utcnow()
    document = {
        'companyId': company_id,
        'vehicleId': data['vehicleId'],
        'type': data['type'],
        'serviceDate': data['serviceDate'],
        'mileage': float(data['mileage']) if data.get('mileage') else vehicle.get('currentMileage'),
        'cost': float(data['cost']) if data.get('cost') else None,
        'garage': data.get('garage') or None,
        'notes': data.get('notes') or None,
        'status': status,
        'invoice': invoice,
        'createdBy': get_jwt_identity(),
        'createdAt': now,
        'updatedAt': now,
        'deletedAt': None,
    }
    result = get_db().fleet_maintenance_records.insert_one(document)
    if status in {'planned', 'in_progress'} and data.get('setVehicleMaintenance') in {'1', 'true', True, 'True'}:
        get_db().fleet_vehicles.update_one(
            {'_id': ObjectId(data['vehicleId']), 'companyId': company_id},
            {'$set': {'status': 'maintenance', 'updatedAt': now}},
        )
    if status == 'completed' and data.get('restoreVehicle') in {'1', 'true', True, 'True'}:
        get_db().fleet_vehicles.update_one(
            {'_id': ObjectId(data['vehicleId']), 'companyId': company_id, 'status': 'maintenance'},
            {'$set': {'status': 'available', 'updatedAt': now}},
        )
    document['_id'] = str(result.inserted_id)
    write_audit(company_id, get_jwt_identity(), 'maintenance.created', 'maintenance_record', result.inserted_id, after=document)
    return jsonify({'record': document}), 201


@fleet_bp.route('/maintenance/records/<record_id>', methods=['PUT'])
@jwt_required()
@fleet_manager_required
def update_maintenance_record(record_id):
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    try:
        existing = get_db().fleet_maintenance_records.find_one({
            '_id': ObjectId(record_id), 'companyId': company_id, 'deletedAt': None,
        })
    except Exception:
        existing = None
    if not existing:
        return jsonify({'error': 'Maintenance record not found'}), 404
    data = _json_or_form()
    update = {key: data[key] for key in ('type', 'serviceDate', 'garage', 'notes', 'status') if key in data}
    if 'mileage' in data and data['mileage'] != '':
        update['mileage'] = float(data['mileage'])
    if 'cost' in data:
        update['cost'] = float(data['cost']) if data['cost'] not in (None, '') else None
    if 'status' in update and update['status'] not in {'planned', 'in_progress', 'completed', 'cancelled'}:
        return jsonify({'error': 'Invalid maintenance status'}), 400
    if request.files.get('invoice'):
        try:
            update['invoice'] = storage.save(request.files['invoice'], 'maintenance')
        except FleetStorageError as error:
            return jsonify({'error': str(error)}), 400
    update['updatedAt'] = datetime.utcnow()
    get_db().fleet_maintenance_records.update_one({'_id': existing['_id']}, {'$set': update})
    if update.get('status') == 'completed':
        get_db().fleet_vehicles.update_one(
            {'_id': ObjectId(existing['vehicleId']), 'companyId': company_id, 'status': 'maintenance'},
            {'$set': {'status': 'available', 'updatedAt': datetime.utcnow()}},
        )
    elif update.get('status') in {'planned', 'in_progress'}:
        get_db().fleet_vehicles.update_one(
            {'_id': ObjectId(existing['vehicleId']), 'companyId': company_id},
            {'$set': {'status': 'maintenance', 'updatedAt': datetime.utcnow()}},
        )
    after = get_db().fleet_maintenance_records.find_one({'_id': existing['_id']})
    after['_id'] = str(after['_id'])
    write_audit(company_id, get_jwt_identity(), 'maintenance.updated', 'maintenance_record', record_id, before=existing, after=after)
    return jsonify({'record': after}), 200


@fleet_bp.route('/maintenance/records/<record_id>', methods=['DELETE'])
@jwt_required()
@fleet_manager_required
def delete_maintenance_record(record_id):
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    result = get_db().fleet_maintenance_records.update_one(
        {'_id': ObjectId(record_id), 'companyId': company_id, 'deletedAt': None},
        {'$set': {'deletedAt': datetime.utcnow(), 'updatedAt': datetime.utcnow()}},
    )
    if not result.matched_count:
        return jsonify({'error': 'Maintenance record not found'}), 404
    write_audit(company_id, get_jwt_identity(), 'maintenance.deleted', 'maintenance_record', record_id)
    return jsonify({'message': 'Maintenance record archived'}), 200


@fleet_bp.route('/maintenance/schedules', methods=['GET'])
@jwt_required()
@fleet_read_required
def list_maintenance_schedules():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    query = {}
    if request.args.get('vehicleId'):
        query['vehicleId'] = request.args['vehicleId']
    schedules = _enrich_with_labels(
        list_documents('fleet_maintenance_schedules', company_id, query, 0, 200, 'nextDueDate', 1),
        company_id,
        driver_key=None,
    )
    return jsonify({'schedules': schedules}), 200


@fleet_bp.route('/maintenance/schedules', methods=['POST'])
@jwt_required()
@fleet_manager_required
def create_maintenance_schedule():
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    data = request.get_json() or {}
    if not data.get('vehicleId') or not data.get('type'):
        return jsonify({'error': 'vehicleId and type are required'}), 400
    if data['type'] not in {'service', 'repair', 'tires', 'inspection', 'other'}:
        return jsonify({'error': 'Invalid maintenance type'}), 400
    if not get_vehicle(data['vehicleId'], company_id):
        return jsonify({'error': 'Vehicle not found'}), 404
    if not data.get('nextDueDate') and data.get('nextDueMileage') in (None, ''):
        return jsonify({'error': 'Provide nextDueDate and/or nextDueMileage'}), 400
    now = datetime.utcnow()
    document = {
        'companyId': company_id,
        'vehicleId': data['vehicleId'],
        'type': data['type'],
        'intervalMonths': int(data['intervalMonths']) if data.get('intervalMonths') else None,
        'intervalKm': float(data['intervalKm']) if data.get('intervalKm') else None,
        'nextDueDate': data.get('nextDueDate') or None,
        'nextDueMileage': float(data['nextDueMileage']) if data.get('nextDueMileage') not in (None, '') else None,
        'notes': data.get('notes') or None,
        'createdBy': get_jwt_identity(),
        'createdAt': now,
        'updatedAt': now,
        'deletedAt': None,
    }
    result = get_db().fleet_maintenance_schedules.insert_one(document)
    document['_id'] = str(result.inserted_id)
    write_audit(company_id, get_jwt_identity(), 'maintenance_schedule.created', 'maintenance_schedule', result.inserted_id, after=document)
    return jsonify({'schedule': document}), 201


@fleet_bp.route('/maintenance/schedules/<schedule_id>', methods=['DELETE'])
@jwt_required()
@fleet_manager_required
def delete_maintenance_schedule(schedule_id):
    user = current_fleet_user()
    company_id = fleet_company_id(user)
    result = get_db().fleet_maintenance_schedules.update_one(
        {'_id': ObjectId(schedule_id), 'companyId': company_id, 'deletedAt': None},
        {'$set': {'deletedAt': datetime.utcnow(), 'updatedAt': datetime.utcnow()}},
    )
    if not result.matched_count:
        return jsonify({'error': 'Schedule not found'}), 404
    write_audit(company_id, get_jwt_identity(), 'maintenance_schedule.deleted', 'maintenance_schedule', schedule_id)
    return jsonify({'message': 'Schedule archived'}), 200
