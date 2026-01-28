"""
Email Service for Notifications
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from database import get_db
from config import Config
import logging

logger = logging.getLogger(__name__)

def get_smtp_settings():
    """Get SMTP settings from database or config"""
    db = get_db()
    settings = db.settings.find_one({"type": "smtp"})
    
    if settings:
        return {
            'host': settings.get('host', Config.SMTP_HOST),
            'port': settings.get('port', Config.SMTP_PORT),
            'username': settings.get('username', Config.SMTP_USERNAME),
            'password': settings.get('password', Config.SMTP_PASSWORD),
            'use_tls': settings.get('use_tls', Config.SMTP_USE_TLS),
            'from_email': settings.get('from_email', Config.SMTP_FROM_EMAIL)
        }
    else:
        return {
            'host': Config.SMTP_HOST,
            'port': Config.SMTP_PORT,
            'username': Config.SMTP_USERNAME,
            'password': Config.SMTP_PASSWORD,
            'use_tls': Config.SMTP_USE_TLS,
            'from_email': Config.SMTP_FROM_EMAIL
        }

def update_smtp_settings(settings_data):
    """Update SMTP settings in database"""
    db = get_db()
    
    settings_data['type'] = 'smtp'
    
    result = db.settings.update_one(
        {"type": "smtp"},
        {"$set": settings_data},
        upsert=True
    )
    
    return result.acknowledged

def send_email(to_email, subject, body):
    """Send email using SMTP"""
    try:
        smtp_settings = get_smtp_settings()
        
        if not smtp_settings.get('username') or not smtp_settings.get('password'):
            logger.warning("SMTP not configured. Email not sent.")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp_settings['from_email']
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Attach HTML body
        html_part = MIMEText(body, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_settings['host'], smtp_settings['port']) as server:
            if smtp_settings['use_tls']:
                server.starttls()
            
            server.login(smtp_settings['username'], smtp_settings['password'])
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def send_leave_notification(user_email, user_name, leave_data, status, comment=''):
    """Send leave request notification"""
    subject = f"Leave Request {status.title()}"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9fafb; padding: 20px; margin-top: 20px; }}
            .status {{ font-weight: bold; color: {'#22c55e' if status == 'approved' else '#ef4444'}; }}
            .footer {{ margin-top: 20px; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>HR Management System</h1>
            </div>
            <div class="content">
                <h2>Hello {user_name},</h2>
                <p>Your leave request has been <span class="status">{status.upper()}</span>.</p>
                
                <h3>Leave Details:</h3>
                <ul>
                    <li><strong>Leave Type:</strong> {leave_data.get('leave_type', '').title()}</li>
                    <li><strong>Start Date:</strong> {leave_data.get('start_date', '')}</li>
                    <li><strong>End Date:</strong> {leave_data.get('end_date', '')}</li>
                    <li><strong>Days:</strong> {leave_data.get('days', '')}</li>
                    <li><strong>Reason:</strong> {leave_data.get('reason', '')}</li>
                </ul>
                
                {f'<p><strong>Review Comment:</strong> {comment}</p>' if comment else ''}
            </div>
            <div class="footer">
                <p>This is an automated message from HR Management System.</p>
                <p>&copy; 2026 HR Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(user_email, subject, body)

def send_salary_advance_notification(user_email, user_name, advance_data, status, comment=''):
    """Send salary advance request notification"""
    subject = f"Salary Advance Request {status.title()}"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9fafb; padding: 20px; margin-top: 20px; }}
            .status {{ font-weight: bold; color: {'#22c55e' if status == 'approved' else '#ef4444'}; }}
            .footer {{ margin-top: 20px; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>HR Management System</h1>
            </div>
            <div class="content">
                <h2>Hello {user_name},</h2>
                <p>Your salary advance request has been <span class="status">{status.upper()}</span>.</p>
                
                <h3>Request Details:</h3>
                <ul>
                    <li><strong>Amount:</strong> {advance_data.get('amount', '')} Dt</li>
                    <li><strong>Reason:</strong> {advance_data.get('reason', '')}</li>
                </ul>
                
                {f'<p><strong>Review Comment:</strong> {comment}</p>' if comment else ''}
            </div>
            <div class="footer">
                <p>This is an automated message from HR Management System.</p>
                <p>&copy; 2026 HR Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(user_email, subject, body)

def send_project_assignment_notification(user_email, user_name, project_data, assigned_by_name):
    """Send project assignment notification"""
    subject = f"You've been assigned to project: {project_data.get('name', 'Unknown')}"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9fafb; padding: 20px; margin-top: 20px; }}
            .project-info {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2563eb; }}
            .footer {{ margin-top: 20px; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>HR Management System</h1>
                <p>Project Assignment Notification</p>
            </div>
            <div class="content">
                <h2>Hello {user_name},</h2>
                <p>You have been assigned to a new project by <strong>{assigned_by_name}</strong>.</p>
                
                <div class="project-info">
                    <h3>Project Details:</h3>
                    <ul>
                        <li><strong>Project Name:</strong> {project_data.get('name', 'N/A')}</li>
                        <li><strong>Description:</strong> {project_data.get('description', 'No description provided')}</li>
                        <li><strong>Status:</strong> {project_data.get('status', 'Active').title()}</li>
                    </ul>
                </div>
                
                <p>You can view more details about this project by logging into the HR Management System.</p>
                <p>Welcome to the team!</p>
            </div>
            <div class="footer">
                <p>This is an automated message from HR Management System.</p>
                <p>&copy; 2026 HR Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(user_email, subject, body)

def test_smtp_connection(test_email):
    """Test SMTP connection by sending a test email"""
    try:
        subject = "Test Email from HR Management System"
        body = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Test Email</h1>
                </div>
                <div style="padding: 20px;">
                    <p>This is a test email from HR Management System.</p>
                    <p>If you received this email, your SMTP configuration is working correctly.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        success = send_email(test_email, subject, body)
        
        if success:
            return True, "Test email sent successfully"
        else:
            return False, "Failed to send test email"
            
    except Exception as e:
        return False, str(e)
