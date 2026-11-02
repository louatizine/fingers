"""Discussion threads on leave / advance / fuel requests."""
import re
from datetime import datetime

from bson.objectid import ObjectId

from database import get_db

MENTION_RE = re.compile(r'@([a-zA-Z0-9._%+\-]+)')


def list_comments(entity_type, entity_id):
    docs = list(get_db().request_comments.find({
        'entityType': entity_type,
        'entityId': str(entity_id),
        'deletedAt': None,
    }).sort('createdAt', 1))
    for doc in docs:
        doc['_id'] = str(doc['_id'])
        if isinstance(doc.get('createdAt'), datetime):
            doc['createdAt'] = doc['createdAt'].isoformat()
    return docs


def create_comment(entity_type, entity_id, author, body, company_id=None):
    now = datetime.utcnow()
    mentions = list({match.group(1).lower() for match in MENTION_RE.finditer(body or '')})
    document = {
        'entityType': entity_type,
        'entityId': str(entity_id),
        'companyId': company_id or author.get('company_id'),
        'authorId': str(author['_id']),
        'authorName': f"{author.get('first_name', '')} {author.get('last_name', '')}".strip(),
        'body': (body or '').strip(),
        'mentions': mentions,
        'createdAt': now,
        'updatedAt': now,
        'deletedAt': None,
    }
    result = get_db().request_comments.insert_one(document)
    document['_id'] = str(result.inserted_id)
    document['createdAt'] = now.isoformat()
    document['updatedAt'] = now.isoformat()
    return document


def resolve_mention_user_ids(emails_or_ids, company_id=None):
    """Resolve @tokens that look like emails to user ids in the same company."""
    db = get_db()
    user_ids = []
    for token in emails_or_ids:
        query = {
            '$or': [
                {'email': {'$regex': f'^{re.escape(token)}$', '$options': 'i'}},
                {'employee_id': token},
            ],
            'is_active': True,
        }
        if company_id:
            query['company_id'] = company_id
        user = db.users.find_one(query)
        if user:
            user_ids.append(str(user['_id']))
    return user_ids
