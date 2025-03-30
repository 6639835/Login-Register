from flask import Blueprint, redirect, current_app, request, jsonify
from werkzeug.exceptions import BadRequest
from .auth.models import User, TokenBlacklist
from datetime import datetime
import logging

verify_bp = Blueprint('verify', __name__)
logger = logging.getLogger(__name__)

@verify_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    """
    Email verification endpoint that redirects to the frontend.
    This endpoint is designed to be called from email links.
    """
    try:
        # Check if token is blacklisted
        if TokenBlacklist.is_blacklisted(token):
            logger.warning(f"Attempt to use blacklisted token: {token[:10]}...")
            return redirect(f"{current_app.config.get('FRONTEND_URL')}/verification-failed?reason=used")
        
        # Verify token
        email = User.verify_token(token)
        if not email:
            logger.warning(f"Invalid verification token: {token[:10]}...")
            return redirect(f"{current_app.config.get('FRONTEND_URL')}/verification-failed?reason=invalid")
        
        # Get user and mark as verified
        user = User.query.filter_by(email=email).first()
        if not user:
            logger.error(f"User not found for email: {email}")
            return redirect(f"{current_app.config.get('FRONTEND_URL')}/verification-failed?reason=user")
        
        # Set as verified if not already
        if not user.is_verified:
            user.is_verified = True
            user.verified_at = datetime.utcnow()
            user.save()
            logger.info(f"User email verified: {email}")
        
        # Blacklist the token
        blacklist = TokenBlacklist(token=token, token_type='verification')
        blacklist.save()
        
        # Redirect to frontend with success
        return redirect(f"{current_app.config.get('FRONTEND_URL')}/verification-success")
        
    except Exception as e:
        logger.error(f"Error during email verification: {str(e)}")
        return redirect(f"{current_app.config.get('FRONTEND_URL')}/verification-failed?reason=error")

@verify_bp.route('/api/verify-token-status/<token>', methods=['GET'])
def verify_token_status(token):
    """
    API endpoint to check token status without actually verifying.
    This is useful for the frontend to check if a token is valid before showing the verification page.
    """
    try:
        # Check if token is blacklisted
        if TokenBlacklist.is_blacklisted(token):
            return jsonify({'valid': False, 'reason': 'Token has already been used'})
        
        # Check token validity
        email = User.verify_token(token, expiration=86400)  # 24 hours
        if not email:
            return jsonify({'valid': False, 'reason': 'Token is invalid or expired'})
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'valid': False, 'reason': 'User not found'})
        
        # Check if already verified
        if user.is_verified:
            return jsonify({'valid': True, 'already_verified': True})
            
        return jsonify({'valid': True, 'already_verified': False})
        
    except Exception as e:
        logger.error(f"Error checking token status: {str(e)}")
        return jsonify({'valid': False, 'reason': 'An error occurred while checking token status'}), 500 

@verify_bp.route('/api/auth/verify/check/<token>', methods=['GET'])
def check_verification_token(token):
    """
    API endpoint to check token status without actually verifying.
    This is for the frontend to verify token validity before proceeding.
    """
    try:
        # Check if token is blacklisted
        if TokenBlacklist.is_blacklisted(token):
            return jsonify({'valid': False, 'message': 'This verification link has already been used'}), 400
        
        # Check token validity
        email = User.verify_token(token, expiration=86400)  # 24 hours
        if not email:
            return jsonify({'valid': False, 'message': 'This verification link is invalid or has expired'}), 400
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'valid': False, 'message': 'User account not found for this verification link'}), 404
        
        # Check if already verified
        if user.is_verified:
            return jsonify({'valid': True, 'already_verified': True, 'message': 'Email is already verified'})
            
        return jsonify({'valid': True, 'already_verified': False, 'message': 'Verification token is valid'})
        
    except Exception as e:
        logger.error(f"Error checking token status: {str(e)}")
        return jsonify({'valid': False, 'message': 'An error occurred while checking token status'}), 500

@verify_bp.route('/api/auth/verify/email/<token>', methods=['GET'])
def verify_email_api(token):
    """
    API endpoint for email verification that returns JSON instead of redirecting.
    This is for the frontend to verify email directly.
    """
    try:
        # Check if token is blacklisted
        if TokenBlacklist.is_blacklisted(token):
            return jsonify({'success': False, 'message': 'This verification link has already been used'}), 400
        
        # Verify token
        email = User.verify_token(token)
        if not email:
            return jsonify({'success': False, 'message': 'This verification link is invalid or has expired'}), 400
        
        # Get user and mark as verified
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'success': False, 'message': 'User account not found for this verification link'}), 404
        
        # Set as verified if not already
        if not user.is_verified:
            user.is_verified = True
            user.verified_at = datetime.utcnow()
            user.save()
            logger.info(f"User email verified through API: {email}")
            
            # Blacklist the token
            blacklist = TokenBlacklist(token=token, token_type='verification')
            blacklist.save()
            
            return jsonify({'success': True, 'message': 'Your email has been successfully verified'})
        else:
            return jsonify({'success': True, 'message': 'Your email was already verified'})
        
    except Exception as e:
        logger.error(f"Error during API email verification: {str(e)}")
        return jsonify({'success': False, 'message': 'An error occurred during verification'}), 500 