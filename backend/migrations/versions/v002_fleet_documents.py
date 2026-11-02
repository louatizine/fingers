"""Fleet legal-document indexes."""
from pymongo import ASCENDING


def apply(db):
    db.fleet_vehicle_documents.create_index(
        [('companyId', ASCENDING), ('vehicleId', ASCENDING), ('type', ASCENDING)],
        name='fleet_vehicle_document_type',
    )
    db.fleet_vehicle_documents.create_index(
        [('companyId', ASCENDING), ('expiryDate', ASCENDING)],
        name='fleet_vehicle_document_expiry',
    )
