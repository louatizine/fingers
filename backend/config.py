"""
Application Configuration
"""
import os
from datetime import timedelta, datetime
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

    # Read-only key for Power Apps (header X-API-Key). Empty disables key access.
    # The web app keeps using its Bearer token and does not need this value.
    ATTENDANCE_API_KEY = (os.environ.get('ATTENDANCE_API_KEY') or '').strip()
    
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

    # ZKTeco fingerprint device (K80 / similar terminals)
    ZK_DEVICE_IP = os.environ.get('ZK_DEVICE_IP', '192.168.100.5')
    ZK_DEVICE_PORT = int(os.environ.get('ZK_DEVICE_PORT') or 4370)
    ZK_DEVICE_NAME = os.environ.get('ZK_DEVICE_NAME') or 'ZKTeco K80'
    # Device communication password (0 = default / none). Set if configured on the terminal.
    ZK_DEVICE_PASSWORD = int(os.environ.get('ZK_DEVICE_PASSWORD') or 0)
    ZK_SYNC_ENABLED = os.environ.get('ZK_SYNC_ENABLED', 'true').lower() == 'true'
    # Comma-separated local times for automatic device sync (ATTENDANCE_TIMEZONE)
    # Example: 08:00,08:30,09:00 — add evening times if check-outs should auto-import too
    ZK_SYNC_TIMES = os.environ.get('ZK_SYNC_TIMES') or '08:00,08:30,09:00'
    # Legacy interval mode (minutes). Used only when ZK_SYNC_TIMES is empty.
    ZK_SYNC_INTERVAL_MINUTES = int(os.environ.get('ZK_SYNC_INTERVAL_MINUTES') or 0)
    # Only import attendance on or after this date (default: 6 months ago)
    ZK_SYNC_MIN_DATE = os.environ.get('ZK_SYNC_MIN_DATE') or (
        datetime.now() - timedelta(days=180)
    ).strftime('%Y-%m-%d')
    # Local timezone for grouping device events into calendar days
    ATTENDANCE_TIMEZONE = os.environ.get('ATTENDANCE_TIMEZONE') or 'Africa/Algiers'

    @staticmethod
    def parse_zk_sync_times(raw: str | None = None) -> list[tuple[int, int]]:
        """Parse 'HH:MM,HH:MM,...' into sorted unique (hour, minute) tuples."""
        value = (raw if raw is not None else Config.ZK_SYNC_TIMES) or ''
        times: list[tuple[int, int]] = []
        seen: set[tuple[int, int]] = set()
        for part in value.split(','):
            part = part.strip()
            if not part:
                continue
            try:
                hour_str, minute_str = part.split(':', 1)
                hour, minute = int(hour_str), int(minute_str)
            except (ValueError, TypeError):
                continue
            if not (0 <= hour <= 23 and 0 <= minute <= 59):
                continue
            key = (hour, minute)
            if key not in seen:
                seen.add(key)
                times.append(key)
        times.sort()
        return times
    ZK_DEVICE_TIMEOUT = int(os.environ.get('ZK_DEVICE_TIMEOUT') or 15)
    ZK_DEVICE_MAX_RETRIES = int(os.environ.get('ZK_DEVICE_MAX_RETRIES') or 5)
