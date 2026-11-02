"""Fleet fuel allocation and purchase indexes."""
from pymongo import ASCENDING, DESCENDING


def apply(db):
    db.fleet_settings.create_index(
        [('companyId', ASCENDING), ('key', ASCENDING)],
        unique=True,
        name='fleet_setting_company_key_unique',
    )
    db.fleet_fuel_limits.create_index(
        [('companyId', ASCENDING), ('driverId', ASCENDING), ('period', ASCENDING), ('effectiveFrom', ASCENDING)],
        name='fleet_fuel_limit_scope',
    )
    db.fleet_fuel_purchases.create_index([('companyId', ASCENDING), ('driverId', ASCENDING), ('purchaseDate', DESCENDING)])
    db.fleet_fuel_purchases.create_index([('companyId', ASCENDING), ('status', ASCENDING)])
    db.fleet_fuel_purchases.create_index([('companyId', ASCENDING), ('flagged', ASCENDING)])
    db.fleet_fuel_purchases.create_index(
        [('receiptHash', ASCENDING)],
        unique=True,
        sparse=True,
        name='fleet_receipt_hash_unique',
    )
    db.fleet_fuel_period_totals.create_index(
        [('companyId', ASCENDING), ('driverId', ASCENDING), ('vehicleId', ASCENDING), ('periodKey', ASCENDING), ('limitId', ASCENDING)],
        unique=True,
        name='fleet_fuel_period_total_unique',
    )
