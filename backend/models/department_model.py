"""Department org structure helpers."""
from datetime import datetime

from bson.objectid import ObjectId

from database import get_db


def _serialize(doc):
    if not doc:
        return None
    doc = dict(doc)
    doc['_id'] = str(doc['_id'])
    if isinstance(doc.get('managerIds'), list):
        doc['managerIds'] = [str(value) for value in doc['managerIds']]
    for key in ('createdAt', 'updatedAt', 'deletedAt'):
        if isinstance(doc.get(key), datetime):
            doc[key] = doc[key].isoformat()
    return doc


def list_departments(company_id=None):
    query = {'deletedAt': None}
    if company_id:
        query['companyId'] = company_id
    docs = get_db().departments.find(query).sort('name', 1)
    return [_serialize(doc) for doc in docs]


def get_department(department_id, company_id=None):
    try:
        query = {'_id': ObjectId(department_id), 'deletedAt': None}
    except Exception:
        return None
    if company_id:
        query['companyId'] = company_id
    return _serialize(get_db().departments.find_one(query))


def create_department(data, actor_id):
    now = datetime.utcnow()
    document = {
        'companyId': data['companyId'],
        'name': str(data['name']).strip(),
        'managerIds': [str(value) for value in (data.get('managerIds') or [])],
        'createdBy': actor_id,
        'createdAt': now,
        'updatedAt': now,
        'deletedAt': None,
    }
    result = get_db().departments.insert_one(document)
    document['_id'] = result.inserted_id
    return _serialize(document)


def update_department(department_id, data, company_id=None):
    existing = get_department(department_id, company_id)
    if not existing:
        return None
    update = {'updatedAt': datetime.utcnow()}
    if 'name' in data and str(data['name']).strip():
        update['name'] = str(data['name']).strip()
    if 'managerIds' in data:
        update['managerIds'] = [str(value) for value in (data.get('managerIds') or [])]
    get_db().departments.update_one({'_id': ObjectId(department_id)}, {'$set': update})
    return get_department(department_id, company_id)


def delete_department(department_id, company_id=None):
    existing = get_department(department_id, company_id)
    if not existing:
        return False
    get_db().departments.update_one(
        {'_id': ObjectId(department_id)},
        {'$set': {'deletedAt': datetime.utcnow(), 'updatedAt': datetime.utcnow()}},
    )
    return True


def departments_managed_by(user_id, company_id=None):
    query = {'deletedAt': None, 'managerIds': str(user_id)}
    if company_id:
        query['companyId'] = company_id
    return [_serialize(doc) for doc in get_db().departments.find(query)]


def user_manages_department(user_id, department_id):
    if not department_id:
        return False
    try:
        doc = get_db().departments.find_one({
            '_id': ObjectId(department_id),
            'deletedAt': None,
            'managerIds': str(user_id),
        })
    except Exception:
        return False
    return bool(doc)
