from app import create_app, db
from app.models.race import RaceResult

app = create_app()

with app.app_context():
    # Create the race_results table
    db.create_all()
    print("Race results table created successfully!") 