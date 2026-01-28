"""
Company Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.company_model import (
    create_company, get_company_by_id, get_all_companies,
    update_company, delete_company
)
from utils.auth_utils import admin_required
import logging

logger = logging.getLogger(__name__)

company_bp = Blueprint('companies', __name__)

@company_bp.route('', methods=['GET'])
@jwt_required()
def get_companies():
    """Get all companies"""
    try:
        companies = get_all_companies()
        return jsonify({'companies': companies}), 200
        
    except Exception as e:
        logger.error(f"Get companies error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@company_bp.route('/<company_id>', methods=['GET'])
@jwt_required()
def get_company(company_id):
    """Get company by ID"""
    try:
        company = get_company_by_id(company_id)
        
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        return jsonify({'company': company}), 200
        
    except Exception as e:
        logger.error(f"Get company error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@company_bp.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_new_company():
    """Create new company (Admin only)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'annual_leave_days', 'sick_leave_days', 'unpaid_leave_days']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        company_id = create_company(data)
        
        return jsonify({
            'message': 'Company created successfully',
            'company_id': company_id
        }), 201
        
    except Exception as e:
        logger.error(f"Create company error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@company_bp.route('/<company_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_company_data(company_id):
    """Update company (Admin only)"""
    try:
        data = request.get_json()
        
        success = update_company(company_id, data)
        
        if success:
            return jsonify({'message': 'Company updated successfully'}), 200
        else:
            return jsonify({'error': 'Company not found'}), 404
        
    except Exception as e:
        logger.error(f"Update company error: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@company_bp.route('/<company_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_company_data(company_id):
    """Delete company (Admin only)"""
    try:
        success = delete_company(company_id)
        
        if success:
            return jsonify({'message': 'Company deleted successfully'}), 200
        else:
            return jsonify({'error': 'Company not found'}), 404
        
    except Exception as e:
        logger.error(f"Delete company error: {e}")
        return jsonify({'error': 'An error occurred'}), 500
