from . import db, bcrypt
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=True)  # Nullable for social auth users
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Social auth fields
    auth_type = db.Column(db.String(20), default='email')  # 'email', 'github', 'google', 'facebook'
    social_id = db.Column(db.String(100), unique=True, nullable=True)
    profile_image = db.Column(db.String(255), nullable=True)

    def __init__(self, name, email, password=None, auth_type='email', social_id=None, profile_image=None):
        self.name = name
        self.email = email
        self.auth_type = auth_type
        self.social_id = social_id
        self.profile_image = profile_image
        
        # Only hash password for email auth users
        if password and auth_type == 'email':
            self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        if self.password_hash:
            return bcrypt.check_password_hash(self.password_hash, password)
        return False
    
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'auth_type': self.auth_type,
            'profile_image': self.profile_image,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 