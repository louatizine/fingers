"""Request discussion threads."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models.audit_model import write_app_audit
from models.comment_model import create_comment, list_comments, resolve_mention_user_ids
from models.leave_model import get_leave_by_id
from models.notif_model import create_notification
from models.salary_advance_model import get_salary_advance_by_id
from models.user_model import find_user_by_id
from utils.org_permissions import can_approve_request, same_company

comment_bp = Blueprint('comments', __name__)

ALLOWED_TYPES = {'leave', 'salary_advance', 'fuel_purchase'}


def _load_entity(entity_type, entity_id):
    if entity_type == 'leave':
        return get_leave_by_id(entity_id)
    if entity_type == 'salary_advance':
        return get_salary_advance_by_id(entity_id)
    if entity_type == 'fuel_purchase':
        from database import get_db
        from bson.objectid import ObjectId
        try:
            doc = get_db().fleet_fuel_purchases.find_one({'_id': ObjectId(entity_id), 'deletedAt': None})
        except Exception:
            return None
        if doc:
            doc['_id'] = str(doc['_id'])
            doc['company_id'] = doc.get('companyId')
            doc['user_id'] = doc.get('driverId') or doc.get('createdBy')
        return doc
    return None


def _can_access(user, entity):
    if not entity or not user:
        return False
    if user.get('role') == 'admin':
        return True
    owner_id = str(entity.get('user_id') or '')
    if owner_id and owner_id == str(user.get('_id')):
        return True
    if user.get('role') == 'supervisor' and same_company(user, entity):
        return True
    return can_approve_request(user, entity)


@comment_bp.route('/<entity_type>/<entity_id>', methods=['GET'])
@jwt_required()
def get_comments(entity_type, entity_id):
    if entity_type not in ALLOWED_TYPES:
        return jsonify({'error': 'Unsupported entity type'}), 400
    user = find_user_by_id(get_jwt_identity())
    entity = _load_entity(entity_type, entity_id)
    if not entity:
        return jsonify({'error': 'Entity not found'}), 404
    if not _can_access(user, entity):
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'comments': list_comments(entity_type, entity_id)}), 200


@comment_bp.route('/<entity_type>/<entity_id>', methods=['POST'])
@jwt_required()
def post_comment(entity_type, entity_id):
    if entity_type not in ALLOWED_TYPES:
        return jsonify({'error': 'Unsupported entity type'}), 400
    user = find_user_by_id(get_jwt_identity())
    entity = _load_entity(entity_type, entity_id)
    if not entity:
        return jsonify({'error': 'Entity not found'}), 404
    if not _can_access(user, entity):
        return jsonify({'error': 'Unauthorized'}), 403
    body = (request.get_json() or {}).get('body', '').strip()
    if not body:
        return jsonify({'error': 'Comment body is required'}), 400
    comment = create_comment(entity_type, entity_id, user, body, entity.get('company_id') or entity.get('companyId'))
    mentioned_ids = resolve_mention_user_ids(comment.get('mentions') or [], user.get('company_id'))
    for mentioned_id in mentioned_ids:
        if mentioned_id == str(user['_id']):
            continue
        create_notification({
            'user_id': mentioned_id,
            'title': 'You were mentioned',
            'message': f"{comment['authorName']} mentioned you on a {entity_type.replace('_', ' ')} discussion",
            'type': 'mention',
            'related_id': entity_id,
            'priority': 'medium',
            'company_id': user.get('company_id'),
        })
    owner_id = str(entity.get('user_id') or '')
    if owner_id and owner_id != str(user['_id']) and owner_id not in mentioned_ids:
        create_notification({
            'user_id': owner_id,
            'title': 'New comment on your request',
            'message': f"{comment['authorName']}: {body[:120]}",
            'type': 'request_comment',
            'related_id': entity_id,
            'priority': 'low',
            'company_id': user.get('company_id'),
        })
    write_app_audit(
        user.get('company_id'), get_jwt_identity(), 'comment.created', entity_type, entity_id,
        after={'commentId': comment['_id']},
    )
    return jsonify({'comment': comment}), 201
