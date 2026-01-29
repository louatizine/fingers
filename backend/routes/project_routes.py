"""
Project Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.project_model import (
    create_project, get_project_by_id, get_all_projects,
    update_project, delete_project, assign_employee_to_project,
    remove_employee_from_project
)
from models.user_model import find_user_by_id, get_active_users_only
from utils.auth_utils import admin_or_supervisor_required
import logging

logger = logging.getLogger(__name__)

project_bp = Blueprint('projects', __name__)

@project_bp.route('', methods=['GET'])
@jwt_required()
def get_projects():
    try:
        from bson.objectid import ObjectId
        
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)

        filters = {}
        if current_user['role'] != 'admin':
            filters['company_id'] = current_user['company_id']
        
        # For employees, only return projects they're assigned to
        if current_user['role'] == 'employee':
            user_object_id = ObjectId(current_user['_id'])
            user_id_str = str(current_user['_id'])
            filters['$or'] = [
                {'assigned_users': user_object_id},
                {'assigned_users': user_id_str},
                {'assigned_employees': user_object_id},
                {'assigned_employees': user_id_str}
            ]

        projects = get_all_projects(filters)

        # 🔥 FIX: always return FULL USER OBJECTS
        # Support both 'assigned_employees' and 'assigned_users' for backward compatibility
        for project in projects:
            # Get the assigned user IDs (check both field names)
            user_ids = project.get('assigned_users', []) or project.get('assigned_employees', [])
            
            # Convert all user IDs to strings for consistency
            user_ids_str = []
            for uid in user_ids:
                if isinstance(uid, ObjectId):
                    user_ids_str.append(str(uid))
                else:
                    user_ids_str.append(uid)
            
            # Convert user IDs to full user objects
            project['assigned_users'] = list(
                filter(None, [
                    find_user_by_id(uid)
                    for uid in user_ids_str
                ])
            )
            
            # Ensure we also keep the IDs in string format
            project['assigned_employees'] = user_ids_str

        return jsonify({
            'success': True,
            'projects': projects
        }), 200

    except Exception as e:
        logger.error(f"Get projects error: {e}")
        return jsonify({'success': False, 'error': 'Fetch failed'}), 500


@project_bp.route('', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def create_new_project():
    """Create a new project with validation"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name') or not data['name'].strip():
            return jsonify({'success': False, 'error': 'Project name is required'}), 400
            
        if not data.get('company_id'):
            return jsonify({'success': False, 'error': 'Company ID is required'}), 400
        
        # Description is optional but set default
        data.setdefault('description', '')
        
        # Assigned users defaults to empty array
        data.setdefault('assigned_users', [])
        
        # Additional optional fields
        data.setdefault('status', 'active')
        data.setdefault('start_date', None)
        data.setdefault('end_date', None)
        data.setdefault('budget', None)
        
        logger.info(f"Creating project: {data['name']} for company: {data['company_id']}")
        project_id = create_project(data)
        
        # Get the created project with full details
        project = get_project_by_id(project_id)
        if project:
            # Populate assigned users with full user objects
            user_ids = project.get('assigned_users', []) or project.get('assigned_employees', [])
            
            # Convert all user IDs to strings for consistency
            user_ids_str = []
            for uid in user_ids:
                if isinstance(uid, ObjectId):
                    user_ids_str.append(str(uid))
                else:
                    user_ids_str.append(uid)
            
            project['assigned_users'] = list(
                filter(None, [
                    find_user_by_id(uid)
                    for uid in user_ids_str
                ])
            )
            # Also include the user_ids array for compatibility
            project['assigned_employees'] = user_ids_str

        return jsonify({
            'success': True,
            'message': 'Project created successfully',
            'project': project  # Return the full project object
        }), 201

    except Exception as e:
        logger.error(f"Create project error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@project_bp.route('/<project_id>/assign/<user_id>', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def assign_user_to_project(project_id, user_id):
    """Assign a user to a project"""
    try:
        from services.email_service import send_project_assignment_notification
        from bson.objectid import ObjectId
        
        current_user_id = get_jwt_identity()
        current_user = find_user_by_id(current_user_id)
        
        # Verify user exists and is active
        user = find_user_by_id(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Check if user is deactivated
        if user.get('status') == 'deactivated' or user.get('is_active') == False:
            return jsonify({'success': False, 'error': 'Cannot assign deactivated user to project'}), 400
        
        # Verify project exists
        project = get_project_by_id(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        # Check if user is already assigned (check both string and ObjectId formats)
        user_ids = project.get('assigned_users', []) or project.get('assigned_employees', [])
        
        # Convert user_id to ObjectId for comparison
        user_id_obj = ObjectId(user_id) if ObjectId.is_valid(user_id) else None
        
        is_already_assigned = False
        for uid in user_ids:
            if uid == user_id or (user_id_obj and uid == user_id_obj):
                is_already_assigned = True
                break
        
        if is_already_assigned:
            return jsonify({'success': False, 'error': 'User already assigned to this project'}), 400
        
        success = assign_employee_to_project(project_id, user_id)

        if not success:
            return jsonify({'success': False, 'error': 'Failed to assign user'}), 500

        # Send email notification to the assigned user
        try:
            assigned_by_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}"
            user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}"
            
            send_project_assignment_notification(
                user_email=user.get('email'),
                user_name=user_name,
                project_data=project,
                assigned_by_name=assigned_by_name
            )
            logger.info(f"Assignment email sent to {user.get('email')}")
        except Exception as email_error:
            logger.warning(f"Failed to send assignment email: {email_error}")
            # Don't fail the assignment if email fails

        logger.info(f"Assigned user {user_id} to project {project_id}")
        return jsonify({
            'success': True,
            'message': f'{user.get("first_name", "")} {user.get("last_name", "")} assigned successfully'
        }), 200

    except Exception as e:
        logger.error(f"Assign user error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@project_bp.route('/<project_id>/remove/<user_id>', methods=['POST'])
@jwt_required()
@admin_or_supervisor_required
def remove_employee(project_id, user_id):
    """Remove a user from a project"""
    try:
        # Verify project exists
        project = get_project_by_id(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        # Check if user is assigned
        if user_id not in project.get('assigned_users', []) and user_id not in project.get('assigned_employees', []):
            return jsonify({'success': False, 'error': 'User not assigned to this project'}), 400
        
        success = remove_employee_from_project(project_id, user_id)
        if success:
            logger.info(f"Removed user {user_id} from project {project_id}")
            return jsonify({'success': True, 'message': 'User removed successfully'}), 200
        return jsonify({'success': False, 'error': 'Failed to remove user'}), 500
    except Exception as e:
        logger.error(f"Remove user error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500