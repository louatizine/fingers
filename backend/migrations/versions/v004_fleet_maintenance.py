"""Fleet maintenance records and schedules indexes."""
from pymongo import ASCENDING, DESCENDING


def apply(db):
    db.fleet_maintenance_records.create_index(
        [('companyId', ASCENDING), ('vehicleId', ASCENDING), ('serviceDate', DESCENDING)],
        name='fleet_maintenance_vehicle_date',
    )
    db.fleet_maintenance_records.create_index(
        [('companyId', ASCENDING), ('status', ASCENDING)],
        name='fleet_maintenance_status',
    )
    db.fleet_maintenance_schedules.create_index(
        [('companyId', ASCENDING), ('vehicleId', ASCENDING), ('nextDueDate', ASCENDING)],
        name='fleet_maintenance_schedule_due',
    )
    db.fleet_maintenance_schedules.create_index(
        [('companyId', ASCENDING), ('vehicleId', ASCENDING), ('type', ASCENDING)],
        name='fleet_maintenance_schedule_type',
    )
