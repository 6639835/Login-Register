from datetime import datetime
from flask_jwt_extended import create_access_token
from flask import current_app
import pyotp
from werkzeug.exceptions import BadRequest, Unauthorized, Forbidden
import qrcode
import io
import base64
from .models import User, TokenBlacklist

class AuthService:
    """Service class for authentication-related operations."""
    
    @staticmethod
    def register_user(name, email, password):
        """Register a new user with email/password."""
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            raise BadRequest('Email already registered')
        
        # Create user
        user = User(name=name, email=email, password=password)
        user.save()
        
        # Return user without sensitive information
        return user
    
    @staticmethod
    def login_user(email, password):
        """Login a user with email/password."""
        user = User.query.filter_by(email=email).first()
        
        # Check if user exists and password is correct
        if not user or not user.check_password(password):
            raise Unauthorized('Invalid email or password')
        
        # Check if user is verified
        if not user.is_verified and user.auth_type == 'email':
            raise Forbidden('Email not verified. Please verify your email.')
        
        # Return user and token based on 2FA status
        if user.two_factor_enabled:
            return {'user': user, 'requires_2fa': True}
        else:
            token = create_access_token(identity=user.id)
            return {'user': user, 'token': token, 'requires_2fa': False}
    
    @staticmethod
    def verify_2fa(user_id, token):
        """Verify 2FA token."""
        user = User.get_by_id(user_id)
        
        if not user:
            raise Unauthorized('User not found')
        
        if user.is_2fa_locked():
            raise Forbidden('Too many failed attempts. Please try again later.')
        
        # Check if the token is a backup code
        if len(token) == 8:  # Backup codes are 8 characters
            if not user.verify_backup_code(token):
                raise Unauthorized('Invalid backup code')
        # Regular TOTP verification
        elif not user.verify_2fa(token):
            raise Unauthorized('Invalid 2FA code')
        
        # Generate JWT token upon successful 2FA
        access_token = create_access_token(identity=user.id)
        return {'token': access_token}
    
    @staticmethod
    def setup_2fa(user_id):
        """Set up 2FA for a user."""
        user = User.get_by_id(user_id)
        if not user:
            raise Unauthorized('User not found')
        
        # Generate new secret
        secret = user.generate_2fa_secret()
        
        # Generate QR code
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name=current_app.config.get('APP_NAME', 'SecureAuth')
        )
        
        # Create QR code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert image to base64
        buffered = io.BytesIO()
        img.save(buffered)
        qr_code = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        # Return setup data (but don't enable 2FA yet)
        return {
            'secret': secret,
            'qr_code': qr_code,
            'backup_codes': user.backup_codes
        }
    
    @staticmethod
    def confirm_2fa(user_id, token):
        """Confirm and enable 2FA for a user."""
        user = User.get_by_id(user_id)
        if not user:
            raise Unauthorized('User not found')
        
        # Verify the provided token
        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(token):
            raise BadRequest('Invalid verification code')
        
        # Enable 2FA
        user.two_factor_enabled = True
        user.save()
        
        return {'success': True, 'backup_codes': user.backup_codes}
    
    @staticmethod
    def disable_2fa(user_id, password):
        """Disable 2FA for a user."""
        user = User.get_by_id(user_id)
        if not user:
            raise Unauthorized('User not found')
        
        # Verify password for security
        if not user.check_password(password):
            raise Unauthorized('Invalid password')
        
        # Disable 2FA
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.backup_codes = None
        user.save()
        
        return {'success': True}
    
    @staticmethod
    def verify_email(token):
        """Verify a user's email address."""
        # Check if token is blacklisted
        if TokenBlacklist.is_blacklisted(token):
            raise BadRequest('Token already used')
        
        # Verify token
        email = User.verify_token(token)
        if not email:
            raise BadRequest('Invalid or expired token')
        
        # Get user and mark as verified
        user = User.query.filter_by(email=email).first()
        if not user:
            raise BadRequest('User not found')
        
        # Set as verified if not already
        if not user.is_verified:
            user.is_verified = True
            user.verified_at = datetime.utcnow()
            user.save()
        
        # Blacklist the token
        blacklist = TokenBlacklist(token=token, token_type='verification')
        blacklist.save()
        
        return {'success': True}
    
    @staticmethod
    def initiate_password_reset(email):
        """Initiate password reset process."""
        user = User.query.filter_by(email=email).first()
        
        # Always return success even if user not found (for security)
        if not user:
            return {'success': True}
        
        # Generate token
        s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        token = s.dumps(email, salt='password-reset')
        
        return {'success': True, 'token': token}
    
    @staticmethod
    def complete_password_reset(token, new_password):
        """Complete password reset with new password."""
        # Check if token is blacklisted
        if TokenBlacklist.is_blacklisted(token):
            raise BadRequest('Token already used')
        
        # Verify token
        s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        try:
            email = s.loads(token, salt='password-reset', max_age=3600)
        except:
            raise BadRequest('Invalid or expired token')
        
        # Find user and update password
        user = User.query.filter_by(email=email).first()
        if not user:
            raise BadRequest('User not found')
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Blacklist the token
        blacklist = TokenBlacklist(token=token, token_type='reset')
        blacklist.save()
        
        return {'success': True}
