from datetime import datetime, timedelta
from itsdangerous import URLSafeTimedSerializer
import os
import pyotp
import json
import logging
from .. import db, bcrypt
from ..common.models import BaseModel
from ..common.utils import encrypt_data, decrypt_data

logger = logging.getLogger(__name__)

class User(db.Model, BaseModel):
    """User model representing application users."""
    
    # Basic user fields
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=True)  # Nullable for social auth users
    
    # Social auth fields
    auth_type = db.Column(db.String(20), default='email', index=True)  # 'email', 'github', 'google', 'facebook'
    social_id = db.Column(db.String(100), unique=True, nullable=True, index=True)
    profile_image = db.Column(db.String(255), nullable=True)
    
    # Email verification fields
    is_verified = db.Column(db.Boolean, default=False, index=True)
    verified_at = db.Column(db.DateTime, nullable=True)

    # 2FA fields - encrypted storage
    two_factor_enabled = db.Column(db.Boolean, default=False)
    _two_factor_secret = db.Column(db.String(255), nullable=True, name="two_factor_secret")
    _backup_codes = db.Column(db.Text, nullable=True, name="backup_codes")
    last_2fa_attempt = db.Column(db.DateTime, nullable=True)
    failed_2fa_attempts = db.Column(db.Integer, default=0)
    
    def __init__(self, name, email, password=None, auth_type='email', social_id=None, profile_image=None):
        """Initialize a new user."""
        self.name = name
        self.email = email
        self.auth_type = auth_type
        self.social_id = social_id
        self.profile_image = profile_image
        
        # Only hash password for email auth users
        if password and auth_type == 'email':
            self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # Users who sign in with social providers are automatically verified
        if auth_type != 'email':
            self.is_verified = True
            self.verified_at = datetime.utcnow()
    
    @property
    def two_factor_secret(self):
        """Get decrypted 2FA secret."""
        if not self._two_factor_secret:
            return None
        return decrypt_data(self._two_factor_secret)
    
    @two_factor_secret.setter
    def two_factor_secret(self, value):
        """Set encrypted 2FA secret."""
        if value is None:
            self._two_factor_secret = None
        else:
            self._two_factor_secret = encrypt_data(value)
    
    @property
    def backup_codes(self):
        """Get decrypted backup codes."""
        if not self._backup_codes:
            return None
        decrypted_data = decrypt_data(self._backup_codes)
        return json.loads(decrypted_data)
    
    @backup_codes.setter
    def backup_codes(self, value):
        """Set encrypted backup codes."""
        if value is None:
            self._backup_codes = None
        else:
            json_data = json.dumps(value)
            self._backup_codes = encrypt_data(json_data)
    
    def check_password(self, password):
        """Check if password matches stored hash."""
        if self.password_hash:
            return bcrypt.check_password_hash(self.password_hash, password)
        return False
    
    def set_password(self, password):
        """Set a new password."""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def to_dict(self):
        """Convert user to dictionary for API responses."""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'auth_type': self.auth_type,
            'profile_image': self.profile_image,
            'is_verified': self.is_verified,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'two_factor_enabled': self.two_factor_enabled,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def generate_verification_token(self):
        """Generate an email verification token."""
        s = URLSafeTimedSerializer(os.environ.get('SECRET_KEY'))
        return s.dumps(self.email, salt='email-verification')
    
    @staticmethod
    def verify_token(token, expiration=3600):
        """Verify an email verification token."""
        s = URLSafeTimedSerializer(os.environ.get('SECRET_KEY'))
        try:
            email = s.loads(token, salt='email-verification', max_age=expiration)
            return email
        except Exception:
            return None

    def generate_2fa_secret(self):
        """Generate a new 2FA secret and backup codes."""
        self.two_factor_secret = pyotp.random_base32()
        # Generate 8 backup codes
        self.backup_codes = [pyotp.random_base32()[:8] for _ in range(8)]
        return self.two_factor_secret

    def verify_2fa(self, token):
        """Verify a 2FA token."""
        if not self.two_factor_enabled or not self.two_factor_secret:
            return False
        
        totp = pyotp.TOTP(self.two_factor_secret)
        is_valid = totp.verify(token)
        
        if is_valid:
            self.failed_2fa_attempts = 0
            self.last_2fa_attempt = datetime.utcnow()
        else:
            self.failed_2fa_attempts += 1
            self.last_2fa_attempt = datetime.utcnow()
        
        return is_valid

    def verify_backup_code(self, code):
        """Verify a backup code and remove it if valid."""
        if not self.backup_codes:
            return False
        
        if code in self.backup_codes:
            backup_codes = self.backup_codes
            backup_codes.remove(code)
            self.backup_codes = backup_codes
            self.failed_2fa_attempts = 0
            self.last_2fa_attempt = datetime.utcnow()
            return True
        return False

    def is_2fa_locked(self):
        """Check if 2FA is locked due to too many failed attempts."""
        if not self.last_2fa_attempt:
            return False
        
        # Lock 2FA for 10 minutes after 5 failed attempts
        if self.failed_2fa_attempts >= 5:
            lock_time = timedelta(minutes=10)
            if datetime.utcnow() - self.last_2fa_attempt < lock_time:
                return True
            else:
                # Reset counter after lock period
                self.failed_2fa_attempts = 0
        
        return False

class TokenBlacklist(db.Model, BaseModel):
    """Store used tokens to prevent reuse (for email verification, password reset, etc.)"""
    
    token = db.Column(db.String(500), unique=True, nullable=False, index=True)
    blacklisted_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    token_type = db.Column(db.String(20), default='verification', index=True)  # 'verification', 'reset', etc.
    
    @staticmethod
    def is_blacklisted(token):
        """Check if a token is blacklisted."""
        return TokenBlacklist.query.filter_by(token=token).first() is not None
