"""Indexes for fleet clients and worked hour entries."""
from pymongo import ASCENDING, DESCENDING


def apply(db):
    db.fleet_clients.create_index(
        [('companyId', ASCENDING), ('name', ASCENDING)],
        name='fleet_client_company_name',
        partialFilterExpression={'deletedAt': None},
    )
    db.fleet_clients.create_index(
        [('companyId', ASCENDING), ('isActive', ASCENDING)],
        name='fleet_client_company_active',
    )
    db.fleet_assignments.create_index(
        [('companyId', ASCENDING), ('clientId', ASCENDING)],
        name='fleet_assignment_company_client',
    )
    db.worked_hour_entries.create_index(
        [('companyId', ASCENDING), ('driverId', ASCENDING), ('date', ASCENDING)],
        unique=True,
        name='worked_hours_company_driver_date_unique',
        partialFilterExpression={'deletedAt': None},
    )
    db.worked_hour_entries.create_index(
        [('companyId', ASCENDING), ('date', DESCENDING)],
        name='worked_hours_company_date',
    )
    db.worked_hour_entries.create_index(
        [('companyId', ASCENDING), ('status', ASCENDING), ('date', DESCENDING)],
        name='worked_hours_company_status_date',
    )
    db.worked_hour_entries.create_index(
        [('companyId', ASCENDING), ('clientId', ASCENDING)],
        name='worked_hours_company_client',
    )
