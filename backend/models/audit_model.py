"""App-wide audit trail (extends fleet-style logging)."""
from datetime import datetime

from bson.objectid import ObjectId

from database import get_db


def write_app_audit(company_id, actor_id, action, entity_type, entity_id, before=None, after=None, meta=None):
    get_db().app_audit_logs.insert_one({
        'companyId': company_id,
        'actorId': str(actor_id) if actor_id else None,
        'action': action,
        'entityType': entity_type,
        'entityId': str(entity_id) if entity_id is not None else None,
        'before': before,
        'after': after,
        'meta': meta or {},
        'createdAt': datetime.utcnow(),
    })


def list_app_audit(company_id=None, limit=100, entity_type=None):
    query = {}
    if company_id:
        query['companyId'] = company_id
    if entity_type:
        query['entityType'] = entity_type
    docs = list(get_db().app_audit_logs.find(query).sort('createdAt', -1).limit(limit))
    for doc in docs:
        doc['_id'] = str(doc['_id'])
        if isinstance(doc.get('createdAt'), datetime):
            doc['createdAt'] = doc['createdAt'].isoformat()
    return docs
