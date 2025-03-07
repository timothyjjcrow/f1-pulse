from app import db
from datetime import datetime

class Driver(db.Model):
    """Model representing an F1 driver"""
    __tablename__ = 'drivers'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(3))  # Driver code (e.g., HAM, VER)
    number = db.Column(db.Integer)  # Driver number
    driver_id = db.Column(db.String(50), unique=True, nullable=False)  # Used for API mapping
    nationality = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    profile_img_url = db.Column(db.String(255))
    helmet_img_url = db.Column(db.String(255))
    biography = db.Column(db.Text)
    
    # Current championship data
    current_position = db.Column(db.Integer)
    current_points = db.Column(db.Float, default=0.0)
    
    # Historical data
    championships = db.Column(db.Integer, default=0)
    race_wins = db.Column(db.Integer, default=0)
    podiums = db.Column(db.Integer, default=0)
    pole_positions = db.Column(db.Integer, default=0)
    fastest_laps = db.Column(db.Integer, default=0)
    first_race_year = db.Column(db.Integer)
    
    # Foreign keys
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f'<Driver {self.first_name} {self.last_name}>' 