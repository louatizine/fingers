"""
Project Model - Database operations for project management
"""
from database import get_db
from bson.objectid import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def create_project(project_data):
    """
    Create a new project
    """
    try:
        db = get_db()
        project_data['created_at'] = datetime.utcnow()
        project_data.setdefault('status', 'planning')
        project_data.setdefault('assigned_employees', [])
        project_data.setdefault('assigned_users', [])
        
        result = db.projects.insert_one(project_data)
        
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        return None

def get_project_by_id(project_id):
    """
    Get project by ID
    """
    try:
        db = get_db()
        project = db.projects.find_one({'_id': ObjectId(project_id)})
        if project:
            project['_id'] = str(project['_id'])
        return project
    except Exception as e:
        logger.error(f"Error getting project by ID: {e}")
        return None

def get_all_projects(filters=None):
    """
    Get all projects with optional filters
    """
    try:
        db = get_db()
        query = {}
        
        if filters:
            if 'company_id' in filters:
                query['company_id'] = filters['company_id']
            if 'status' in filters:
                query['status'] = filters['status']
        
        projects = list(db.projects.find(query).sort('created_at', -1))
        for project in projects:
            project['_id'] = str(project['_id'])
        return projects
    except Exception as e:
        logger.error(f"Error getting all projects: {e}")
        return []

def get_user_projects(user_id):
    """
    Get projects assigned to a specific user
    """
    try:
        db = get_db()
        user_object_id = ObjectId(user_id)
        
        projects = list(db.projects.find({
            '$or': [
                {'assigned_users': user_object_id},
                {'assigned_users': user_id},
                {'assigned_employees': user_object_id},
                {'assigned_employees': user_id}
            ]
        }).sort('created_at', -1))
        
        for project in projects:
            project['_id'] = str(project['_id'])
        return projects
    except Exception as e:
        logger.error(f"Error getting user projects: {e}")
        return []

def update_project(project_id, update_data):
    """
    Update project information
    """
    try:
        db = get_db()
        update_data['updated_at'] = datetime.utcnow()
        
        result = db.projects.update_one(
            {'_id': ObjectId(project_id)},
            {'$set': update_data}
        )
        
        return result.modified_count > 0 or result.matched_count > 0
    except Exception as e:
        logger.error(f"Error updating project: {e}")
        return False

def delete_project(project_id):
    """
    Delete a project
    """
    try:
        db = get_db()
        result = db.projects.delete_one({'_id': ObjectId(project_id)})
        
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Error deleting project: {e}")
        return False

def assign_users_to_project(project_id, user_ids):
    """
    Assign users to a project
    """
    try:
        db = get_db()
        
        # Convert user IDs to ObjectId
        object_ids = [ObjectId(uid) if isinstance(uid, str) else uid for uid in user_ids]
        
        result = db.projects.update_one(
            {'_id': ObjectId(project_id)},
            {'$addToSet': {'assigned_users': {'$each': object_ids}}}
        )
        
        return result.modified_count > 0 or result.matched_count > 0
    except Exception as e:
        logger.error(f"Error assigning users to project: {e}")
        return False

def assign_employee_to_project(project_id, user_id):
    """
    Assign an employee to a project (singular)
    """
    try:
        db = get_db()
        user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        
        result = db.projects.update_one(
            {'_id': ObjectId(project_id)},
            {'$addToSet': {'assigned_users': user_object_id, 'assigned_employees': user_object_id}}
        )
        
        return result.modified_count > 0 or result.matched_count > 0
    except Exception as e:
        logger.error(f"Error assigning employee to project: {e}")
        return False

def remove_user_from_project(project_id, user_id):
    """
    Remove a user from a project
    """
    try:
        db = get_db()
        user_object_id = ObjectId(user_id)
        
        result = db.projects.update_one(
            {'_id': ObjectId(project_id)},
            {'$pull': {'assigned_users': user_object_id, 'assigned_employees': user_object_id}}
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error removing user from project: {e}")
        return False

def remove_employee_from_project(project_id, user_id):
    """
    Remove an employee from a project (alias for compatibility)
    """
    return remove_user_from_project(project_id, user_id)

def get_project_statistics(company_id=None):
    """
    Get project statistics
    """
    try:
        db = get_db()
        query = {}
        
        if company_id:
            query['company_id'] = company_id
        
        projects = list(db.projects.find(query))
        
        stats = {
            'total': len(projects),
            'planning': len([p for p in projects if p.get('status') == 'planning']),
            'in_progress': len([p for p in projects if p.get('status') == 'in_progress']),
            'completed': len([p for p in projects if p.get('status') == 'completed']),
            'on_hold': len([p for p in projects if p.get('status') == 'on_hold'])
        }
        
        return stats
    except Exception as e:
        logger.error(f"Error getting project statistics: {e}")
        return {
            'total': 0,
            'planning': 0,
            'in_progress': 0,
            'completed': 0,
            'on_hold': 0
        }
