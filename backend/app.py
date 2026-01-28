"""
Main Flask Application Entry Point
HR Management System - ERP
"""
from dotenv import load_dotenv
load_dotenv()  # Load environment variables first

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from database import init_db
import logging

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Initialize database
    init_db(app)
    
    # Register blueprints
    from routes.auth_routes import auth_bp
    from routes.user_routes import user_bp
    from routes.leave_routes import leave_bp
    from routes.salary_advance_routes import salary_advance_bp
    from routes.project_routes import project_bp
    from routes.notification_routes import notification_bp
    from routes.company_routes import company_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.settings_route import settings_bp
    from routes.fingerprint_routes import fingerprint_bp
    from routes.attendance_routes import attendance_bp
    from routes.terminal_routes import terminal_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(leave_bp, url_prefix='/api/leaves')
    app.register_blueprint(salary_advance_bp, url_prefix='/api/salary-advances')
    app.register_blueprint(project_bp, url_prefix='/api/projects')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')
    app.register_blueprint(company_bp, url_prefix='/api/companies')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(fingerprint_bp, url_prefix='/api/fingerprint')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(terminal_bp, url_prefix='/api/terminal')  # Unauthenticated terminal routes 
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'message': 'HR Management System API is running'}, 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
