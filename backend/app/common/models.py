from datetime import datetime
from sqlalchemy.ext.declarative import declared_attr
from .. import db

class BaseModel:
    """Base model class with common functionality for all models."""
    
    @declared_attr
    def __tablename__(cls):
        """Convert CamelCase class name to snake_case table name."""
        return (cls.__name__[0].lower() + 
                ''.join('_' + c.lower() if c.isupper() else c 
                         for c in cls.__name__[1:]))
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @classmethod
    def get_by_id(cls, id):
        """Get model instance by ID."""
        return cls.query.filter_by(id=id).first()
    
    @classmethod
    def create(cls, **kwargs):
        """Create a new model instance."""
        instance = cls(**kwargs)
        return instance.save()
    
    def update(self, **kwargs):
        """Update model instance."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        return self.save()
    
    def save(self):
        """Save model instance to database."""
        db.session.add(self)
        db.session.commit()
        return self
    
    def delete(self):
        """Delete model instance from database."""
        db.session.delete(self)
        db.session.commit()
        return self
    
    def to_dict(self):
        """Convert model to dictionary."""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result 