from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import BadRequest, Unauthorized, NotFound
from marshmallow import Schema, fields, validate, ValidationError
from .services import UserService
from .models import LoginHistory

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

class ValidationSchema:
    """Validation schemas for request data."""
    
    class UpdateProfileSchema(Schema):
        name = fields.Str(validate=validate.Length(min=2, max=100))
        bio = fields.Str()
        phone = fields.Str(validate=validate.Length(max=20))
        birthday = fields.Date()
        address_line1 = fields.Str(validate=validate.Length(max=255))
        address_line2 = fields.Str(validate=validate.Length(max=255))
        city = fields.Str(validate=validate.Length(max=100))
        state = fields.Str(validate=validate.Length(max=100))
        postal_code = fields.Str(validate=validate.Length(max=20))
        country = fields.Str(validate=validate.Length(max=100))
        language = fields.Str(validate=validate.Length(min=2, max=10))
        timezone = fields.Str(validate=validate.Length(max=50))
        theme = fields.Str(validate=validate.OneOf(['light', 'dark', 'system']))
        notifications_enabled = fields.Boolean()
        profile_visibility = fields.Str(validate=validate.OneOf(['public', 'private', 'contacts']))
    
    class ChangePasswordSchema(Schema):
        current_password = fields.Str(required=True)
        new_password = fields.Str(required=True, validate=validate.Length(min=8))


@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile."""
    try:
        profile = UserService.get_profile()
        
        return jsonify({
            'profile': profile
        }), 200
        
    except Unauthorized as e:
        return jsonify({'error': str(e)}), 401
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        current_app.logger.error(f'Profile retrieval error: {str(e)}')
        return jsonify({'error': 'An error occurred while retrieving profile'}), 500


@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile."""
    try:
        # Validate request data
        schema = ValidationSchema.UpdateProfileSchema()
        data = schema.load(request.json)
        
        # Update profile
        updated_profile = UserService.update_profile(data)
        
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': updated_profile
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except Unauthorized as e:
        return jsonify({'error': str(e)}), 401
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        current_app.logger.error(f'Profile update error: {str(e)}')
        return jsonify({'error': 'An error occurred while updating profile'}), 500


@user_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password."""
    try:
        # Validate request data
        schema = ValidationSchema.ChangePasswordSchema()
        data = schema.load(request.json)
        
        # Change password
        UserService.change_password(
            current_password=data['current_password'],
            new_password=data['new_password']
        )
        
        return jsonify({
            'message': 'Password changed successfully'
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Unauthorized as e:
        return jsonify({'error': str(e)}), 401
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        current_app.logger.error(f'Password change error: {str(e)}')
        return jsonify({'error': 'An error occurred while changing password'}), 500


@user_bp.route('/login-history', methods=['GET'])
@jwt_required()
def get_login_history():
    """Get user login history."""
    try:
        limit = request.args.get('limit', 10, type=int)
        history = UserService.get_login_history(limit=limit)
        
        return jsonify({
            'history': history
        }), 200
        
    except Unauthorized as e:
        return jsonify({'error': str(e)}), 401
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        current_app.logger.error(f'Login history retrieval error: {str(e)}')
        return jsonify({'error': 'An error occurred while retrieving login history'}), 500


@user_bp.route('/record-login', methods=['POST'])
def record_login():
    """Record a login (called internally by auth service)."""
    try:
        user_id = request.json.get('user_id')
        success = request.json.get('success', True)
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Record login
        LoginHistory.record_login(
            user_id=user_id,
            request=request,
            success=success
        )
        
        return jsonify({
            'message': 'Login recorded successfully'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Login recording error: {str(e)}')
        return jsonify({'error': 'An error occurred while recording login'}), 500
