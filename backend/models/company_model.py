"""
Company Model and Operations
"""
from database import get_db
from bson.objectid import ObjectId
from datetime import datetime

def create_company(company_data):
    """Create a new company"""
    db = get_db()
    
    company_data['created_at'] = datetime.utcnow()
    company_data['updated_at'] = datetime.utcnow()
    
    result = db.companies.insert_one(company_data)
    return str(result.inserted_id)

def get_company_by_id(company_id):
    """Get company by ID"""
    db = get_db()
    try:
        company = db.companies.find_one({"_id": ObjectId(company_id)})
        if company:
            company['_id'] = str(company['_id'])
        return company
    except:
        return None

def get_all_companies():
    """Get all companies"""
    db = get_db()
    companies = list(db.companies.find())
    for company in companies:
        company['_id'] = str(company['_id'])
    return companies

def update_company(company_id, update_data):
    """Update company data"""
    db = get_db()
    update_data['updated_at'] = datetime.utcnow()
    
    result = db.companies.update_one(
        {"_id": ObjectId(company_id)},
        {"$set": update_data}
    )
    return result.modified_count > 0

def delete_company(company_id):
    """Delete company"""
    db = get_db()
    result = db.companies.delete_one({"_id": ObjectId(company_id)})
    return result.deleted_count > 0
