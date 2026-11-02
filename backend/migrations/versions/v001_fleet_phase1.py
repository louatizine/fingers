"""Fleet Phase 1 indexes and collection constraints."""
from pymongo import ASCENDING, DESCENDING


def apply(db):
    db.fleet_vehicles.create_index(
        [('companyId', ASCENDING), ('plateNumber', ASCENDING)],
        unique=True,
        name='fleet_vehicle_company_plate_unique',
        partialFilterExpression={'deletedAt': None},
    )
    db.fleet_vehicles.create_index(
        [('companyId', ASCENDING), ('vin', ASCENDING)],
        unique=True,
        name='fleet_vehicle_company_vin_unique',
        partialFilterExpression={'deletedAt': None, 'vin': {'$type': 'string'}},
    )
    db.fleet_vehicles.create_index([('companyId', ASCENDING), ('status', ASCENDING)])
    db.fleet_vehicles.create_index([('companyId', ASCENDING), ('departmentId', ASCENDING)])
    db.fleet_driver_profiles.create_index(
        [('userId', ASCENDING)], unique=True, sparse=True, name='fleet_driver_user_unique_sparse'
    )
    db.fleet_driver_profiles.create_index([('companyId', ASCENDING), ('license.number', ASCENDING)])
    db.fleet_driver_profiles.create_index([('companyId', ASCENDING), ('license.expiryDate', ASCENDING)])
    db.fleet_assignments.create_index([('companyId', ASCENDING), ('vehicleId', ASCENDING), ('startDate', ASCENDING)])
    db.fleet_assignments.create_index([('companyId', ASCENDING), ('driverId', ASCENDING), ('startDate', ASCENDING)])
    db.fleet_assignments.create_index([('companyId', ASCENDING), ('status', ASCENDING)])
    db.fleet_assignments.create_index(
        [('vehicleId', ASCENDING)],
        unique=True,
        name='fleet_vehicle_active_assignment_unique',
        partialFilterExpression={'status': 'active', 'deletedAt': None},
    )
    db.fleet_audit_logs.create_index([('companyId', ASCENDING), ('createdAt', DESCENDING)])
