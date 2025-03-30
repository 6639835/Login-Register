from datetime import datetime
from .. import db
from ..common.models import BaseModel

class UserProfile(db.Model, BaseModel):
    """Extended user profile information."""
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    
    # Personal details
    bio = db.Column(db.Text, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    birthday = db.Column(db.Date, nullable=True)
    
    # Address fields
    address_line1 = db.Column(db.String(255), nullable=True)
    address_line2 = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    
    # Preferences
    language = db.Column(db.String(10), default='en')
    timezone = db.Column(db.String(50), default='UTC')
    theme = db.Column(db.String(20), default='light')  # light, dark, system
    notifications_enabled = db.Column(db.Boolean, default=True)
    
    # Privacy settings
    profile_visibility = db.Column(db.String(20), default='public')  # public, private, contacts
    
    def to_dict(self):
        """Convert profile to dictionary."""
        data = super().to_dict()
        # Remove sensitive fields if needed
        return data

class LoginHistory(db.Model, BaseModel):
    """Track user login history."""
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    ip_address = db.Column(db.String(45), nullable=True)  # IPv6 can be up to 45 chars
    user_agent = db.Column(db.String(255), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    success = db.Column(db.Boolean, default=True)
    
    @classmethod
    def record_login(cls, user_id, request, success=True):
        """Record a login attempt."""
        login = cls(
            user_id=user_id,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string if request.user_agent else None,
            success=success
        )
        
        # Could add geolocation lookup here
        
        login.save()
        return login
