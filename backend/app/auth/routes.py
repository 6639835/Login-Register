from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import BadRequest, Unauthorized, Forbidden
from marshmallow import Schema, fields, validate, ValidationError
from email_validator import validate_email, EmailNotValidError
from .services import AuthService
from ..common.utils import CIPHER
from ..email_utils import send_verification_email, send_password_reset_email

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

class ValidationSchema:
    """Validation schemas for request data."""
    
    class RegisterSchema(Schema):
        name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
        email = fields.Email(required=True)
        password = fields.Str(required=True, validate=validate.Length(min=8))
    
    class LoginSchema(Schema):
        email = fields.Email(required=True)
        password = fields.Str(required=True)
    
    class EmailSchema(Schema):
        email = fields.Email(required=True)
    
    class PasswordResetSchema(Schema):
        token = fields.Str(required=True)
        password = fields.Str(required=True, validate=validate.Length(min=8))
    
    class TwoFactorSchema(Schema):
        user_id = fields.Int(required=True)
        token = fields.Str(required=True)
    
    class DisableTwoFactorSchema(Schema):
        password = fields.Str(required=True)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        # Validate request data
        schema = ValidationSchema.RegisterSchema()
        data = schema.load(request.json)
        
        # Validate email format (additional validation)
        try:
            validate_email(data['email'])
        except EmailNotValidError:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Create user
        user = AuthService.register_user(
            name=data['name'],
            email=data['email'],
            password=data['password']
        )
        
        # Send verification email
        send_verification_email(user)
        
        return jsonify({
            'message': 'User registered successfully. Please check your email to verify your account.',
            'user': user.to_dict()
        }), 201
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f'Registration error: {str(e)}')
        return jsonify({'error': 'An error occurred during registration'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login a user."""
    try:
        # Validate request data
        schema = ValidationSchema.LoginSchema()
        data = schema.load(request.json)
        
        # Authenticate user
        result = AuthService.login_user(
            email=data['email'],
            password=data['password']
        )
        
        # Handle 2FA if needed
        if result.get('requires_2fa'):
            return jsonify({
                'message': 'Two-factor authentication required',
                'requires_2fa': True,
                'user_id': result['user'].id
            }), 200
        
        # Return successful login with token
        return jsonify({
            'message': 'Login successful',
            'token': result['token'],
            'user': result['user'].to_dict()
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Unauthorized as e:
        return jsonify({'error': str(e)}), 401
    except Forbidden as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        current_app.logger.error(f'Login error: {str(e)}')
        return jsonify({'error': 'An error occurred during login'}), 500


@auth_bp.route('/verify-2fa', methods=['POST'])
def verify_2fa():
    """Verify 2FA token."""
    try:
        # Validate request data
        schema = ValidationSchema.TwoFactorSchema()
        data = schema.load(request.json)
        
        # Verify 2FA
        result = AuthService.verify_2fa(
            user_id=data['user_id'],
            token=data['token']
        )
        
        return jsonify({
            'message': '2FA verification successful',
            'token': result['token']
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Unauthorized as e:
        return jsonify({'error': str(e)}), 401
    except Forbidden as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        current_app.logger.error(f'2FA verification error: {str(e)}')
        return jsonify({'error': 'An error occurred during 2FA verification'}), 500


@auth_bp.route('/setup-2fa', methods=['POST'])
@jwt_required()
def setup_2fa():
    """Set up 2FA for a user."""
    try:
        user_id = get_jwt_identity()
        
        # Set up 2FA
        result = AuthService.setup_2fa(user_id=user_id)
        
        return jsonify({
            'message': '2FA setup initiated',
            'secret': result['secret'],
            'qr_code': result['qr_code'],
            'backup_codes': result['backup_codes']
        }), 200
        
    except Unauthorized as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        current_app.logger.error(f'2FA setup error: {str(e)}')
        return jsonify({'error': 'An error occurred during 2FA setup'}), 500


@auth_bp.route('/confirm-2fa', methods=['POST'])
@jwt_required()
def confirm_2fa():
    """Confirm and enable 2FA for a user."""
    try:
        user_id = get_jwt_identity()
        token = request.json.get('token')
        
        if not token:
            return jsonify({'error': 'Token is required'}), 400
        
        # Confirm 2FA
        result = AuthService.confirm_2fa(
            user_id=user_id,
            token=token
        )
        
        return jsonify({
            'message': '2FA enabled successfully',
            'backup_codes': result['backup_codes']
        }), 200
        
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except Unauthorized as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        current_app.logger.error(f'2FA confirmation error: {str(e)}')
        return jsonify({'error': 'An error occurred during 2FA confirmation'}), 500


@auth_bp.route('/disable-2fa', methods=['POST'])
@jwt_required()
def disable_2fa():
    """Disable 2FA for a user."""
    try:
        user_id = get_jwt_identity()
        
        # Validate request data
        schema = ValidationSchema.DisableTwoFactorSchema()
        data = schema.load(request.json)
        
        # Disable 2FA
        AuthService.disable_2fa(
            user_id=user_id,
            password=data['password']
        )
        
        return jsonify({
            'message': '2FA disabled successfully'
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Unauthorized as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        current_app.logger.error(f'2FA disabling error: {str(e)}')
        return jsonify({'error': 'An error occurred while disabling 2FA'}), 500


@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    """Verify a user's email address."""
    try:
        # Verify email
        AuthService.verify_email(token=token)
        
        return jsonify({
            'message': 'Email verified successfully'
        }), 200
        
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f'Email verification error: {str(e)}')
        return jsonify({'error': 'An error occurred during email verification'}), 500


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Initiate password reset process."""
    try:
        # Validate request data
        schema = ValidationSchema.EmailSchema()
        data = schema.load(request.json)
        
        # Initiate password reset
        result = AuthService.initiate_password_reset(
            email=data['email']
        )
        
        # Send reset email (if user exists)
        if 'token' in result:
            from ..auth.models import User
            user = User.query.filter_by(email=data['email']).first()
            if user:
                send_password_reset_email(user, result['token'])
        
        return jsonify({
            'message': 'If your email is registered, you will receive a password reset link'
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        current_app.logger.error(f'Password reset request error: {str(e)}')
        return jsonify({'error': 'An error occurred during password reset request'}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Complete password reset with new password."""
    try:
        # Validate request data
        schema = ValidationSchema.PasswordResetSchema()
        data = schema.load(request.json)
        
        # Complete password reset
        AuthService.complete_password_reset(
            token=data['token'],
            new_password=data['password']
        )
        
        return jsonify({
            'message': 'Password reset successful'
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f'Password reset completion error: {str(e)}')
        return jsonify({'error': 'An error occurred during password reset'}), 500
