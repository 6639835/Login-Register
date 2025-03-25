from flask import Blueprint, request, jsonify, redirect, url_for, session, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_cors import cross_origin
from .models import User
from . import db, oauth
import re
import os
import json
from urllib.parse import urlencode

# Create blueprints
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
user_bp = Blueprint('user', __name__, url_prefix='/api/users')

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

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
def register():
    print("Register endpoint called")
    data = request.get_json()
    print(f"Received registration data: {data}")
    
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
        
        # Generate access token
        access_token = create_access_token(identity=new_user.id)
        
        return jsonify({
            "message": "User registered successfully",
            "token": access_token,
            "user": new_user.to_dict()
        }), 201
    
    except Exception as e:
        print(f"Error during registration: {str(e)}")
        db.session.rollback()
        return jsonify({"message": f"Registration failed: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
@cross_origin()
def login():
    print("Login endpoint called")
    data = request.get_json()
    print(f"Received login data: {data}")
    
    # Validate required fields
    if not all(k in data for k in ('email', 'password')):
        return jsonify({"message": "Missing email or password"}), 400
    
    # Find user by email
    user = User.query.filter_by(email=data['email']).first()
    
    # Verify user exists and password is correct
    if not user or not user.check_password(data['password']):
        return jsonify({"message": "Invalid email or password"}), 401
    
    # Generate access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "user": user.to_dict()
    }), 200

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
    
    try:
        db.session.commit()
        return jsonify({
            "message": "Profile updated successfully",
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