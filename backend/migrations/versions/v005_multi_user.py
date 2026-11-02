"""Indexes for departments, app audit, request comments."""
from pymongo import ASCENDING, DESCENDING


def apply(db):
    db.departments.create_index(
        [('companyId', ASCENDING), ('name', ASCENDING)],
        unique=True,
        name='department_company_name_unique',
        partialFilterExpression={'deletedAt': None},
    )
    db.departments.create_index([('companyId', ASCENDING), ('managerIds', ASCENDING)])
    db.users.create_index([('company_id', ASCENDING), ('departmentId', ASCENDING)])
    db.app_audit_logs.create_index([('companyId', ASCENDING), ('createdAt', DESCENDING)])
    db.app_audit_logs.create_index([('entityType', ASCENDING), ('entityId', ASCENDING)])
    db.request_comments.create_index(
        [('entityType', ASCENDING), ('entityId', ASCENDING), ('createdAt', ASCENDING)],
    )
