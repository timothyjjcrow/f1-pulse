from app import db
from datetime import datetime

class Circuit(db.Model):
    """Model representing an F1 circuit"""
    __tablename__ = 'circuits'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    circuit_id = db.Column(db.String(50), unique=True, nullable=False)  # Used for API mapping
    location = db.Column(db.String(100))
    country = db.Column(db.String(100))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    length_km = db.Column(db.Float)  # Circuit length in kilometers
    lap_record = db.Column(db.String(100))  # Lap record time and holder
    lap_record_year = db.Column(db.Integer)
    map_img_url = db.Column(db.String(255))
    description = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    races = db.relationship('Race', backref='circuit', lazy=True)
    
    def __repr__(self):
        return f'<Circuit {self.name}, {self.country}>'


class Race(db.Model):
    """Model representing an F1 race event"""
    __tablename__ = 'races'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    race_id = db.Column(db.String(50), unique=True, nullable=False)  # Used for API mapping
    season = db.Column(db.Integer, nullable=False)
    round = db.Column(db.Integer, nullable=False)
    
    # Dates
    race_date = db.Column(db.DateTime)
    qualifying_date = db.Column(db.DateTime)
    sprint_date = db.Column(db.DateTime)
    fp1_date = db.Column(db.DateTime)
    fp2_date = db.Column(db.DateTime)
    fp3_date = db.Column(db.DateTime)
    
    # Status
    status = db.Column(db.String(20), default='upcoming')  # 'upcoming', 'in_progress', 'completed'
    
    # Foreign keys
    circuit_id = db.Column(db.Integer, db.ForeignKey('circuits.id'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    results = db.relationship('RaceResult', backref='race', lazy=True)
    
    def __repr__(self):
        return f'<Race {self.name}, {self.season} Round {self.round}>'


class RaceResult(db.Model):
    """Model representing a driver's result in a specific race"""
    __tablename__ = 'race_results'
    
    id = db.Column(db.Integer, primary_key=True)
    race_id = db.Column(db.Integer, db.ForeignKey('races.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    
    # Result data
    position = db.Column(db.Integer)
    grid = db.Column(db.Integer)
    status = db.Column(db.String(50))  # e.g., 'Finished', 'Retired', etc.
    points = db.Column(db.Float, default=0.0)
    laps = db.Column(db.Integer)
    time = db.Column(db.String(50))  # Race time as a string (e.g. "1:30:45.123")
    fastest_lap = db.Column(db.Boolean, default=False)
    fastest_lap_time = db.Column(db.String(20))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<RaceResult Race:{self.race_id} Driver:{self.driver_id} Pos:{self.position}>' 