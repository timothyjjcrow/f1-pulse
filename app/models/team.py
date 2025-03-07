from app import db
from datetime import datetime

class Team(db.Model):
    """Model representing an F1 team"""
    __tablename__ = 'teams'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    team_principal = db.Column(db.String(100))
    base_location = db.Column(db.String(100))
    website = db.Column(db.String(255))
    logo_url = db.Column(db.String(255))
    constructor_id = db.Column(db.String(50), unique=True, nullable=False)  # Used for API mapping
    
    # Current championship data
    current_position = db.Column(db.Integer)
    current_points = db.Column(db.Float, default=0.0)
    
    # Historical data
    championships = db.Column(db.Integer, default=0)
    race_wins = db.Column(db.Integer, default=0)
    podiums = db.Column(db.Integer, default=0)
    first_entry_year = db.Column(db.Integer)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    drivers = db.relationship('Driver', backref='team', lazy=True)
    
    def __repr__(self):
        return f'<Team {self.name}>' 