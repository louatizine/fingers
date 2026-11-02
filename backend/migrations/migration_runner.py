"""Idempotent MongoDB migration runner."""
from datetime import datetime
import logging

from database import get_db

logger = logging.getLogger(__name__)


def run_migrations():
    db = get_db()
    migrations = (
        ('001_create_fleet_phase1_indexes', 'migrations.versions.v001_fleet_phase1'),
        ('002_create_fleet_document_indexes', 'migrations.versions.v002_fleet_documents'),
        ('003_create_fleet_fuel_indexes', 'migrations.versions.v003_fleet_fuel'),
        ('004_create_fleet_maintenance_indexes', 'migrations.versions.v004_fleet_maintenance'),
        ('005_create_multi_user_indexes', 'migrations.versions.v005_multi_user'),
    )
    for version, module_name in migrations:
        if db.schema_migrations.find_one({'version': version}):
            continue
        module = __import__(module_name, fromlist=['apply'])
        module.apply(db)
        db.schema_migrations.insert_one({
            'version': version,
            'applied_at': datetime.utcnow(),
        })
        logger.info('Applied database migration %s', version)
