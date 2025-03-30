from flask import Blueprint, request, jsonify, redirect, url_for, session, current_app, render_template
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_cors import cross_origin
from .models import User, TokenBlacklist
from . import db, oauth
from .email_utils import send_email
import re
import os
import json
import pyotp
import qrcode
from io import BytesIO
import base64
from urllib.parse import urlencode
from datetime import datetime, timedelta
import logging
from functools import wraps
import time
import hashlib

# Setup logging
logger = logging.getLogger(__name__)

# Create blueprints
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
user_bp = Blueprint('user', __name__, url_prefix='/api/users')

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

# Simple in-memory rate limiter (for demonstration purposes)
# In production, use Redis or a dedicated rate limiting solution
class RateLimiter:
    def __init__(self, max_requests=5, window=60):
        self.max_requests = max_requests  # Max requests per window
        self.window = window  # Window in seconds
        self.clients = {}
    
    def is_rate_limited(self, client_id):
        now = time.time()
        
        # Create a new entry if client doesn't exist
        if client_id not in self.clients:
            self.clients[client_id] = []
        
        # Clean old requests
        self.clients[client_id] = [timestamp for timestamp in self.clients[client_id] 
                                   if timestamp > now - self.window]
        
        # Check if rate limited
        if len(self.clients[client_id]) >= self.max_requests:
            return True
        
        # Add this request
        self.clients[client_id].append(now)
        return False

# Initialize rate limiters
login_limiter = RateLimiter(max_requests=5, window=60)  # 5 requests per minute
registration_limiter = RateLimiter(max_requests=3, window=300)  # 3 requests per 5 minutes
two_factor_limiter = RateLimiter(max_requests=5, window=300)  # 5 requests per 5 minutes

def rate_limit(limiter):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client identifier - prefer X-Forwarded-For for proxies
            ip = request.headers.get('X-Forwarded-For', request.remote_addr)
            
            # For APIs that require authentication, can also use the user id
            # to prevent one user from affecting others behind same IP
            user_agent = request.headers.get('User-Agent', '')
            
            # Create a unique client ID based on IP and user agent
            client_id = hashlib.md5(f"{ip}:{user_agent}".encode()).hexdigest()
            
            if limiter.is_rate_limited(client_id):
                logger.warning(f"Rate limit exceeded for client {ip}")
                return jsonify({"message": "Rate limit exceeded. Please try again later."}), 429
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Helper function to get user and token
def get_user_and_token(user):
    access_token = create_access_token(identity=user.id)
    return {
        "message": "Login successful",
        "token": access_token,
        "user": user.to_dict()
    }

# Authentication routes
@auth_bp.route('/register', methods=['POST'])
@cross_origin()
@rate_limit(registration_limiter)
def register():
    logger.info("Register endpoint called")
    data = request.get_json()
    logger.debug(f"Received registration data: {data}")
    
    # Validate required fields
    if not all(k in data for k in ('name', 'email', 'password')):
        return jsonify({"message": "Missing required fields"}), 400
    
    # Validate email format
    if not EMAIL_REGEX.match(data['email']):
        return jsonify({"message": "Invalid email format"}), 400
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already registered"}), 409
    
    # Validate password length
    if len(data['password']) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400
    
    # Create new user
    try:
        new_user = User(
            name=data['name'],
            email=data['email'],
            password=data['password'],
            auth_type='email'
        )
        db.session.add(new_user)
        db.session.commit()
        
        # Generate verification token and send email
        token = new_user.generate_verification_token()
        verification_url = f"{os.environ.get('FRONTEND_URL')}/verify-email/{token}"
        
        try:
            send_email(
                to=new_user.email,
                subject="Verify Your Email Address",
                template="email/verify_email.html",
                name=new_user.name,
                verification_url=verification_url,
                year=datetime.now().year
            )
        except Exception as e:
            print(f"Failed to send verification email: {str(e)}")
            # Continue with registration even if email fails
        
        # Generate access token
        access_token = create_access_token(identity=new_user.id)
        
        return jsonify({
            "message": "User registered successfully. Please check your email to verify your account.",
            "token": access_token,
            "user": new_user.to_dict()
        }), 201
    
    except Exception as e:
        print(f"Error during registration: {str(e)}")
        db.session.rollback()
        return jsonify({"message": f"Registration failed: {str(e)}"}), 500

@auth_bp.route('/verify-email/<token>', methods=['GET'])
@cross_origin()
def verify_email(token):
    # Check if token is blacklisted
    if TokenBlacklist.is_blacklisted(token):
        return render_template(
            "email/verification_success.html",
            success=False,
            error_message="This verification link has already been used.",
            frontend_url=os.environ.get('FRONTEND_URL')
        )
    
    # Verify token
    email = User.verify_token(token, expiration=86400)  # 24 hours expiration
    
    if not email:
        return render_template(
            "email/verification_success.html",
            success=False,
            error_message="The verification link is invalid or has expired.",
            frontend_url=os.environ.get('FRONTEND_URL')
        )
    
    # Find user by email
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return render_template(
            "email/verification_success.html",
            success=False,
            error_message="User not found.",
            frontend_url=os.environ.get('FRONTEND_URL')
        )
    
    if user.is_verified:
        return render_template(
            "email/verification_success.html",
            success=True,
            frontend_url=os.environ.get('FRONTEND_URL')
        )
    
    # Update user verification status
    user.is_verified = True
    user.verified_at = datetime.utcnow()
    
    # Blacklist token to prevent reuse
    blacklist_token = TokenBlacklist(token=token, token_type="verification")
    
    db.session.add(blacklist_token)
    db.session.commit()
    
    return render_template(
        "email/verification_success.html",
        success=True,
        frontend_url=os.environ.get('FRONTEND_URL')
    )

@auth_bp.route('/resend-verification', methods=['POST'])
@jwt_required()
@cross_origin()
def resend_verification():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    if user.is_verified:
        return jsonify({"message": "Email already verified"}), 400
    
    # Generate verification token and send email
    token = user.generate_verification_token()
    verification_url = f"{os.environ.get('FRONTEND_URL')}/verify-email/{token}"
    
    try:
        send_email(
            to=user.email,
            subject="Verify Your Email Address",
            template="email/verify_email.html",
            name=user.name,
            verification_url=verification_url,
            year=datetime.now().year
        )
        return jsonify({"message": "Verification email has been sent"}), 200
    except Exception as e:
        return jsonify({"message": f"Failed to send verification email: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
@cross_origin()
@rate_limit(login_limiter)
def login():
    logger.info("Login endpoint called")
    data = request.get_json()
    logger.debug(f"Received login data: {data}")
    
    # Validate required fields
    if not all(k in data for k in ('email', 'password')):
        return jsonify({"message": "Missing email or password"}), 400
    
    # Find user by email
    user = User.query.filter_by(email=data['email']).first()
    
    # Verify user exists and password is correct
    if not user or not user.check_password(data['password']):
        return jsonify({"message": "Invalid email or password"}), 401
    
    # Check if user's email is verified
    if not user.is_verified:
        return jsonify({
            "message": "Email not verified",
            "verification_required": True,
            "email": user.email
        }), 403

    # Check if 2FA is enabled
    if user.two_factor_enabled:
        # Generate temporary token for 2FA verification
        # This token will have limited permissions and short expiration time
        temp_token = create_access_token(
            identity=user.id,
            additional_claims={"temp": True, "for_2fa": True},
            expires_delta=timedelta(minutes=5)
        )
        
        return jsonify({
            "message": "2FA verification required",
            "requires_2fa": True,
            "user_id": user.id,
            "temp_token": temp_token
        }), 200
    
    # If 2FA is not enabled, return full access token
    return get_user_and_token(user)

@auth_bp.route('/forgot-password', methods=['POST'])
@cross_origin()
def forgot_password():
    data = request.get_json()
    
    if not data or 'email' not in data:
        return jsonify({"message": "Email is required"}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        # Don't reveal if email exists for security reasons
        return jsonify({"message": "If your email is registered, you will receive password reset instructions"}), 200
    
    # In a real app, you would generate a reset token and send an email
    # For this demo, we'll just return a success message
    return jsonify({"message": "If your email is registered, you will receive password reset instructions"}), 200

# OAuth login routes
@auth_bp.route('/github')
@cross_origin()
def github_login():
    redirect_uri = os.environ.get('GITHUB_REDIRECT_URI')
    return oauth.github.authorize_redirect(redirect_uri)

@auth_bp.route('/github/callback')
@cross_origin()
def github_callback():
    try:
        token = oauth.github.authorize_access_token()
        resp = oauth.github.get('user', token=token)
        profile = resp.json()
        
        # Get user email (GitHub may not provide it directly)
        emails_resp = oauth.github.get('user/emails', token=token)
        emails = emails_resp.json()
        primary_email = next((email['email'] for email in emails if email['primary']), None)
        
        if not primary_email:
            return redirect(f"{os.environ.get('FRONTEND_URL')}/login?error=Email%20not%20found")
        
        # Check if user exists
        user = User.query.filter_by(social_id=str(profile['id']), auth_type='github').first()
        
        if not user:
            # Check if email already exists
            email_user = User.query.filter_by(email=primary_email).first()
            if email_user:
                # Link accounts
                email_user.social_id = str(profile['id'])
                email_user.auth_type = 'github'
                email_user.profile_image = profile.get('avatar_url')
                email_user.is_verified = True
                email_user.verified_at = datetime.utcnow() if not email_user.verified_at else email_user.verified_at
                user = email_user
            else:
                # Create new user
                user = User(
                    name=profile.get('name') or profile.get('login'),
                    email=primary_email,
                    auth_type='github',
                    social_id=str(profile['id']),
                    profile_image=profile.get('avatar_url')
                )
                db.session.add(user)
                
        db.session.commit()
        
        # Generate token
        token = create_access_token(identity=user.id)
        
        # Redirect to frontend with token
        redirect_params = {
            'token': token,
            'user': json.dumps(user.to_dict())
        }
        redirect_url = f"{os.environ.get('FRONTEND_URL')}/oauth/callback?{urlencode(redirect_params)}"
        return redirect(redirect_url)
        
    except Exception as e:
        print(f"GitHub OAuth error: {str(e)}")
        return redirect(f"{os.environ.get('FRONTEND_URL')}/login?error=Authentication%20failed")

@auth_bp.route('/google')
@cross_origin()
def google_login():
    redirect_uri = os.environ.get('GOOGLE_REDIRECT_URI')
    return oauth.google.authorize_redirect(redirect_uri)

@auth_bp.route('/google/callback')
@cross_origin()
def google_callback():
    try:
        token = oauth.google.authorize_access_token()
        resp = oauth.google.get('userinfo', token=token)
        profile = resp.json()
        
        # Check if user exists
        user = User.query.filter_by(social_id=profile['id'], auth_type='google').first()
        
        if not user:
            # Check if email already exists
            email_user = User.query.filter_by(email=profile['email']).first()
            if email_user:
                # Link accounts
                email_user.social_id = profile['id']
                email_user.auth_type = 'google'
                email_user.profile_image = profile.get('picture')
                email_user.is_verified = True
                email_user.verified_at = datetime.utcnow() if not email_user.verified_at else email_user.verified_at
                user = email_user
            else:
                # Create new user
                user = User(
                    name=profile.get('name'),
                    email=profile.get('email'),
                    auth_type='google',
                    social_id=profile['id'],
                    profile_image=profile.get('picture')
                )
                db.session.add(user)
                
        db.session.commit()
        
        # Generate token
        token = create_access_token(identity=user.id)
        
        # Redirect to frontend with token
        redirect_params = {
            'token': token,
            'user': json.dumps(user.to_dict())
        }
        redirect_url = f"{os.environ.get('FRONTEND_URL')}/oauth/callback?{urlencode(redirect_params)}"
        return redirect(redirect_url)
        
    except Exception as e:
        print(f"Google OAuth error: {str(e)}")
        return redirect(f"{os.environ.get('FRONTEND_URL')}/login?error=Authentication%20failed")

@auth_bp.route('/facebook')
@cross_origin()
def facebook_login():
    redirect_uri = os.environ.get('FACEBOOK_REDIRECT_URI')
    return oauth.facebook.authorize_redirect(redirect_uri)

@auth_bp.route('/facebook/callback')
@cross_origin()
def facebook_callback():
    try:
        token = oauth.facebook.authorize_access_token()
        resp = oauth.facebook.get('me?fields=id,name,email,picture.type(large)', token=token)
        profile = resp.json()
        
        # Check if user exists
        user = User.query.filter_by(social_id=profile['id'], auth_type='facebook').first()
        
        if not user:
            # Check if email already exists (Facebook might not always provide email)
            if 'email' in profile:
                email_user = User.query.filter_by(email=profile['email']).first()
                if email_user:
                    # Link accounts
                    email_user.social_id = profile['id']
                    email_user.auth_type = 'facebook'
                    email_user.is_verified = True
                    email_user.verified_at = datetime.utcnow() if not email_user.verified_at else email_user.verified_at
                    if 'picture' in profile and 'data' in profile['picture']:
                        email_user.profile_image = profile['picture']['data']['url']
                    user = email_user
            
            if not user:
                # Create new user
                user = User(
                    name=profile.get('name'),
                    email=profile.get('email', f"{profile['id']}@facebook.com"),  # Fallback email
                    auth_type='facebook',
                    social_id=profile['id'],
                    profile_image=profile.get('picture', {}).get('data', {}).get('url')
                )
                db.session.add(user)
                
        db.session.commit()
        
        # Generate token
        token = create_access_token(identity=user.id)
        
        # Redirect to frontend with token
        redirect_params = {
            'token': token,
            'user': json.dumps(user.to_dict())
        }
        redirect_url = f"{os.environ.get('FRONTEND_URL')}/oauth/callback?{urlencode(redirect_params)}"
        return redirect(redirect_url)
        
    except Exception as e:
        print(f"Facebook OAuth error: {str(e)}")
        return redirect(f"{os.environ.get('FRONTEND_URL')}/login?error=Authentication%20failed")

# User routes
@user_bp.route('/me', methods=['GET'])
@jwt_required()
@cross_origin()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    return jsonify(user.to_dict()), 200

@user_bp.route('/verification-status', methods=['GET'])
@jwt_required()
@cross_origin()
def verification_status():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    return jsonify({
        "is_verified": user.is_verified,
        "auth_type": user.auth_type,
        "email": user.email,
        "verified_at": user.verified_at.isoformat() if user.verified_at else None
    }), 200

@user_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
@cross_origin()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    data = request.get_json()
    
    # Update name if provided
    if 'name' in data:
        user.name = data['name']
    
    # Update email if provided
    if 'email' in data and data['email'] != user.email:
        # Validate email format
        if not EMAIL_REGEX.match(data['email']):
            return jsonify({"message": "Invalid email format"}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"message": "Email already in use"}), 409
            
        user.email = data['email']
        
        # If user changes email, they need to verify it again
        if user.auth_type == 'email':
            user.is_verified = False
            user.verified_at = None
            
            # Send verification email for new address
            token = user.generate_verification_token()
            verification_url = f"{os.environ.get('FRONTEND_URL')}/verify-email/{token}"
            
            try:
                send_email(
                    to=user.email,
                    subject="Verify Your New Email Address",
                    template="email/verify_email.html",
                    name=user.name,
                    verification_url=verification_url,
                    year=datetime.now().year
                )
            except Exception as e:
                print(f"Failed to send verification email: {str(e)}")
    
    try:
        db.session.commit()
        return jsonify({
            "message": "Profile updated successfully" + (
                ". Please check your email to verify your new email address." 
                if 'email' in data and data['email'] != user.email and user.auth_type == 'email' 
                else ""
            ),
            "user": user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update profile: {str(e)}"}), 500

@user_bp.route('/change-password', methods=['PUT'])
@jwt_required()
@cross_origin()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    data = request.get_json()
    
    if not all(k in data for k in ('current_password', 'new_password')):
        return jsonify({"message": "Current password and new password required"}), 400
    
    # Verify current password
    if not user.check_password(data['current_password']):
        return jsonify({"message": "Current password is incorrect"}), 401
    
    # Validate new password length
    if len(data['new_password']) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400
    
    # Update password
    user.set_password(data['new_password'])
    
    try:
        db.session.commit()
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update password: {str(e)}"}), 500

@user_bp.route('/delete-account', methods=['DELETE'])
@jwt_required()
@cross_origin()
def delete_account():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Account deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete account: {str(e)}"}), 500

# 2FA Routes
@auth_bp.route('/2fa/setup', methods=['POST'])
@jwt_required()
@cross_origin()
def setup_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # Generate 2FA secret
    secret = user.generate_2fa_secret()
    
    # Generate QR code for TOTP
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(user.email, issuer_name="SecureAuth App")
    
    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer)
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Save changes to database (but don't enable 2FA yet until verified)
    db.session.commit()
    
    return jsonify({
        "message": "2FA setup initiated", 
        "secret": secret,
        "qr_code": qr_code_base64,
        "backup_codes": user.backup_codes
    }), 200

@auth_bp.route('/2fa/verify-setup', methods=['POST'])
@jwt_required()
@cross_origin()
def verify_2fa_setup():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'code' not in data:
        return jsonify({"message": "Verification code is required"}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    if not user.two_factor_secret:
        return jsonify({"message": "2FA setup not initiated"}), 400
    
    # Verify the code
    totp = pyotp.TOTP(user.two_factor_secret)
    if totp.verify(data['code']):
        # Enable 2FA for the user
        user.two_factor_enabled = True
        db.session.commit()
        return jsonify({"message": "2FA setup completed successfully"}), 200
    
    return jsonify({"message": "Invalid verification code"}), 400

@auth_bp.route('/2fa/verify', methods=['POST'])
@cross_origin()
@rate_limit(two_factor_limiter)
def verify_2fa():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('user_id', 'code', 'temp_token')):
        return jsonify({"message": "Missing required fields"}), 400
    
    # Find user by ID
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # Check if 2FA is locked due to too many attempts
    if user.is_2fa_locked():
        return jsonify({"message": "Too many failed attempts. Please try again later."}), 429
    
    # Verify the 2FA code
    if not user.verify_2fa(data['code']):
        return jsonify({"message": "Invalid verification code"}), 401
    
    # Generate new full access token
    return get_user_and_token(user)

@auth_bp.route('/2fa/backup-code', methods=['POST'])
@cross_origin()
def verify_backup_code():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('user_id', 'backup_code', 'temp_token')):
        return jsonify({"message": "Missing required fields"}), 400
    
    # Find user by ID
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # Check if 2FA is locked due to too many attempts
    if user.is_2fa_locked():
        return jsonify({"message": "Too many failed attempts. Please try again later."}), 429
    
    # Verify the backup code
    if not user.verify_backup_code(data['backup_code']):
        return jsonify({"message": "Invalid backup code"}), 401
    
    # Save changes to backup codes list (one was used)
    db.session.commit()
    
    # Generate new full access token
    return get_user_and_token(user)

@auth_bp.route('/2fa/disable', methods=['POST'])
@jwt_required()
@cross_origin()
def disable_2fa():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'password' not in data:
        return jsonify({"message": "Password is required to disable 2FA"}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    if not user.two_factor_enabled:
        return jsonify({"message": "2FA is not enabled"}), 400
    
    # Verify password before disabling 2FA
    if not user.check_password(data['password']):
        return jsonify({"message": "Invalid password"}), 401
    
    # Disable 2FA
    user.two_factor_enabled = False
    user.two_factor_secret = None
    user.backup_codes = None
    user.failed_2fa_attempts = 0
    
    db.session.commit()
    
    return jsonify({"message": "2FA has been disabled"}), 200

# 管理员API端点
@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    # 检查当前用户是否有管理员权限
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 这里应该有一个更完善的权限控制系统
    # 简单起见，假设ID为1的用户是管理员
    if not current_user or current_user.id != 1:
        return jsonify({"error": "Unauthorized - Admin access required"}), 403
    
    users = User.query.all()
    return jsonify({
        "users": [user.to_dict() for user in users]
    }), 200

@app.route('/api/admin/tokens', methods=['GET'])
@jwt_required()
def get_all_tokens():
    # 检查当前用户是否有管理员权限
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 简单起见，假设ID为1的用户是管理员
    if not current_user or current_user.id != 1:
        return jsonify({"error": "Unauthorized - Admin access required"}), 403
    
    tokens = TokenBlacklist.query.all()
    return jsonify({
        "tokens": [
            {
                "id": token.id,
                "token": token.token,
                "token_type": token.token_type,
                "blacklisted_at": token.blacklisted_at.isoformat()
            } for token in tokens
        ]
    }), 200

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    # 检查当前用户是否有管理员权限
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 简单起见，假设ID为1的用户是管理员
    if not current_user or current_user.id != 1:
        return jsonify({"error": "Unauthorized - Admin access required"}), 403
    
    # 不允许删除自己
    if current_user_id == user_id:
        return jsonify({"error": "Cannot delete your own account"}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({"message": "User deleted successfully"}), 200

@app.route('/api/admin/users/<int:user_id>/verify', methods=['PUT'])
@jwt_required()
def toggle_user_verification(user_id):
    # 检查当前用户是否有管理员权限
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 简单起见，假设ID为1的用户是管理员
    if not current_user or current_user.id != 1:
        return jsonify({"error": "Unauthorized - Admin access required"}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # 获取请求数据
    data = request.get_json()
    is_verified = data.get('is_verified', False)
    
    user.is_verified = is_verified
    if is_verified:
        user.verified_at = datetime.utcnow()
    else:
        user.verified_at = None
    
    db.session.commit()
    
    return jsonify({
        "message": "User verification status updated",
        "user": user.to_dict()
    }), 200