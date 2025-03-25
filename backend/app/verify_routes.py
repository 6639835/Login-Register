from flask import Blueprint, render_template, jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from .models import User, TokenBlacklist
from . import db
from .email_utils import send_email
import os
from datetime import datetime

verify_bp = Blueprint('verify', __name__, url_prefix='/api/verify')

@verify_bp.route('/email/<token>', methods=['GET'])
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

def send_verification_email(user):
    """Helper function to send verification email"""
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

@verify_bp.route('/resend', methods=['POST'])
@cross_origin()
def resend_verification():
    data = request.get_json()
    
    # Check if we have a JWT token in the Authorization header
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        # User is authenticated, get user from JWT
        try:
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({"message": "User not found"}), 404
            
            if user.is_verified:
                return jsonify({"message": "Email already verified"}), 400
            
            return send_verification_email(user)
        except Exception as e:
            # If JWT validation fails, continue to check for email in request body
            pass
    
    # No valid token or token validation failed, check if email was provided
    if data and 'email' in data:
        email = data['email']
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        if user.is_verified:
            return jsonify({"message": "Email already verified"}), 400
        
        return send_verification_email(user)
    
    return jsonify({"message": "Authentication required or email must be provided"}), 400 