from werkzeug.exceptions import BadRequest, Unauthorized, NotFound
from flask_jwt_extended import get_jwt_identity
from ..auth.models import User
from .models import UserProfile, LoginHistory

class UserService:
    """Service for user profile operations."""
    
    @staticmethod
    def get_current_user():
        """Get current authenticated user."""
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)
        if not user:
            raise Unauthorized('User not found')
        return user
    
    @staticmethod
    def get_profile(user_id=None):
        """Get user profile."""
        if user_id is None:
            user_id = get_jwt_identity()
        
        # Get user
        user = User.get_by_id(user_id)
        if not user:
            raise NotFound('User not found')
        
        # Get or create profile
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id)
            profile.save()
        
        # Combine user and profile data
        result = user.to_dict()
        result['profile'] = profile.to_dict()
        return result
    
    @staticmethod
    def update_profile(data, user_id=None):
        """Update user profile."""
        if user_id is None:
            user_id = get_jwt_identity()
        
        # Get user
        user = User.get_by_id(user_id)
        if not user:
            raise NotFound('User not found')
        
        # Update basic user fields
        user_fields = ['name', 'email']
        user_updates = {}
        for field in user_fields:
            if field in data:
                # Email requires verification, would need additional logic
                if field == 'email' and data[field] != user.email:
                    raise BadRequest('Email changes require verification')
                user_updates[field] = data[field]
        
        if user_updates:
            user.update(**user_updates)
        
        # Get or create profile
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id)
            profile.save()
        
        # Update profile fields
        profile_fields = [
            'bio', 'phone', 'birthday', 
            'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
            'language', 'timezone', 'theme', 'notifications_enabled', 'profile_visibility'
        ]
        
        profile_updates = {}
        for field in profile_fields:
            if field in data:
                profile_updates[field] = data[field]
        
        if profile_updates:
            profile.update(**profile_updates)
        
        # Return updated profile
        result = user.to_dict()
        result['profile'] = profile.to_dict()
        return result
    
    @staticmethod
    def change_password(current_password, new_password, user_id=None):
        """Change user password."""
        if user_id is None:
            user_id = get_jwt_identity()
        
        # Get user
        user = User.get_by_id(user_id)
        if not user:
            raise NotFound('User not found')
        
        # Verify current password
        if not user.check_password(current_password):
            raise Unauthorized('Current password is incorrect')
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return {'success': True}
    
    @staticmethod
    def get_login_history(limit=10, user_id=None):
        """Get user login history."""
        if user_id is None:
            user_id = get_jwt_identity()
        
        # Get user
        user = User.get_by_id(user_id)
        if not user:
            raise NotFound('User not found')
        
        # Get login history
        history = LoginHistory.query.filter_by(user_id=user_id) \
            .order_by(LoginHistory.created_at.desc()) \
            .limit(limit) \
            .all()
        
        return [item.to_dict() for item in history]
