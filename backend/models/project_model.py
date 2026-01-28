"""
Project Model
"""
from database import get_db
from bson.objectid import ObjectId
from datetime import datetime
import logging

def create_project(project_data):
    db = get_db()
    project_data['created_at'] = datetime.utcnow()
    project_data['updated_at'] = datetime.utcnow()
    project_data.setdefault('assigned_users', [])
    result = db.projects.insert_one(project_data)
    return str(result.inserted_id)

def get_project_by_id(project_id):
    db = get_db()
    try:
        project = db.projects.find_one({"_id": ObjectId(project_id)})
        if project:
            project['_id'] = str(project['_id'])
        return project
    except:
        return None

def get_all_projects(filters=None):
    db = get_db()
    projects = list(db.projects.find(filters or {}))
    for p in projects:
        p['_id'] = str(p['_id'])
    return projects

def update_project(project_id, update_data):
    db = get_db()
    update_data['updated_at'] = datetime.utcnow()
    result = db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_data}
    )
    return result.modified_count > 0

def delete_project(project_id):
    db = get_db()
    result = db.projects.delete_one({"_id": ObjectId(project_id)})
    return result.deleted_count > 0

def assign_employee_to_project(project_id, user_id):
    db = get_db()
    try:
        # Update both field names for compatibility
        result = db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {
                "$addToSet": {
                    "assigned_users": user_id,
                    "assigned_employees": user_id
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0 or result.matched_count > 0
    except Exception as e:
        logging.error(e)
        return False

def remove_employee_from_project(project_id, user_id):
    db = get_db()
    result = db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {
            "$pull": {
                "assigned_users": user_id,
                "assigned_employees": user_id
            },
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    return result.modified_count > 0
