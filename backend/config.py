"""
Application Configuration
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production-2026'
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production-2026'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # MongoDB
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/hr_management_db'
    
    # SMTP Configuration (can be updated via admin panel)
    SMTP_HOST = os.environ.get('SMTP_HOST') or 'smtp.gmail.com'
    SMTP_PORT = int(os.environ.get('SMTP_PORT') or 587)
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME') or ''
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD') or ''
    SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'True') == 'True'
    SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL') or 'noreply@hrmanagement.com'
    
    # Application
    APP_NAME = 'HR Management System'
    FRONTEND_URL = os.environ.get('FRONTEND_URL') or 'http://localhost:3000'
