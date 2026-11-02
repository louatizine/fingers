"""Fleet client (mission customer) helpers."""
from datetime import datetime

from bson.objectid import ObjectId

from database import get_db


def _serialize(doc):
    if not doc:
        return None
    doc = dict(doc)
    doc['_id'] = str(doc['_id'])
    for key in ('createdAt', 'updatedAt', 'deletedAt'):
        if isinstance(doc.get(key), datetime):
            doc[key] = doc[key].isoformat()
    return doc


def list_clients(company_id, *, active_only=False, skip=0, limit=200):
    query = {'companyId': company_id, 'deletedAt': None}
    if active_only:
        query['isActive'] = True
    docs = (
        get_db()
        .fleet_clients.find(query)
        .sort('name', 1)
        .skip(skip)
        .limit(limit)
    )
    return [_serialize(doc) for doc in docs]


def get_client(client_id, company_id=None):
    try:
        query = {'_id': ObjectId(client_id), 'deletedAt': None}
    except Exception:
        return None
    if company_id:
        query['companyId'] = company_id
    return _serialize(get_db().fleet_clients.find_one(query))


def create_client(data, actor_id):
    now = datetime.utcnow()
    name = str(data.get('name') or '').strip()
    if not name:
        raise ValueError('Client name is required')
    document = {
        'companyId': data['companyId'],
        'name': name,
        'code': str(data.get('code') or '').strip() or None,
        'contactName': str(data.get('contactName') or '').strip() or None,
        'phone': str(data.get('phone') or '').strip() or None,
        'email': str(data.get('email') or '').strip() or None,
        'address': str(data.get('address') or '').strip() or None,
        'notes': str(data.get('notes') or '').strip() or None,
        'isActive': bool(data.get('isActive', True)),
        'createdBy': actor_id,
        'createdAt': now,
        'updatedAt': now,
        'deletedAt': None,
    }
    result = get_db().fleet_clients.insert_one(document)
    document['_id'] = result.inserted_id
    return _serialize(document)


def update_client(client_id, data, company_id=None):
    existing = get_client(client_id, company_id)
    if not existing:
        return None
    update = {'updatedAt': datetime.utcnow()}
    for key in ('name', 'code', 'contactName', 'phone', 'email', 'address', 'notes'):
        if key in data:
            value = str(data.get(key) or '').strip()
            if key == 'name' and not value:
                raise ValueError('Client name is required')
            update[key] = value or None
    if 'isActive' in data:
        update['isActive'] = bool(data['isActive'])
    get_db().fleet_clients.update_one({'_id': ObjectId(client_id)}, {'$set': update})
    return get_client(client_id, company_id)


def delete_client(client_id, company_id=None):
    existing = get_client(client_id, company_id)
    if not existing:
        return False
    get_db().fleet_clients.update_one(
        {'_id': ObjectId(client_id)},
        {'$set': {'deletedAt': datetime.utcnow(), 'updatedAt': datetime.utcnow(), 'isActive': False}},
    )
    return True
