#!/usr/bin/env python3
"""
Script to fix the 2024 F1 driver and team standings.
"""

from app import create_app, db
from app.models import Driver, Team
from app.services.ergast_api import ErgastAPI

def main():
    """Fix the 2024 driver and team standings."""
    app = create_app()
    
    with app.app_context():
        print("Fixing 2024 F1 Standings...")
        
        # Initialize API service
        ergast_api = ErgastAPI()
        
        # Fix driver standings
        print("\nUpdating driver standings...")
        driver_data = ergast_api.get_drivers_standings('2024')
        
        if not driver_data or 'MRData' not in driver_data:
            print("Failed to retrieve driver standings")
            return
        
        standings_list = driver_data['MRData']['StandingsTable'].get('StandingsLists', [])
        
        if not standings_list:
            print("No driver standings data available")
            return
        
        driver_standings = standings_list[0]['DriverStandings']
        
        for standing in driver_standings:
            driver_data = standing['Driver']
            constructor = standing['Constructors'][0]
            
            # Find the driver
            driver = Driver.query.filter_by(driver_id=driver_data['driverId']).first()
            
            if not driver:
                print(f"Driver not found: {driver_data['givenName']} {driver_data['familyName']}")
                continue
            
            # Update current position and points
            driver.current_position = int(standing['position'])
            driver.current_points = float(standing['points'])
            
            # Find team
            team = Team.query.filter_by(constructor_id=constructor['constructorId']).first()
            
            if team:
                driver.team_id = team.id
            
            db.session.commit()
            print(f"Updated driver: {driver.first_name} {driver.last_name} - Position: {driver.current_position}")
        
        # Fix team standings
        print("\nUpdating team standings...")
        team_data = ergast_api.get_constructors_standings('2024')
        
        if not team_data or 'MRData' not in team_data:
            print("Failed to retrieve constructor standings")
            return
        
        standings_list = team_data['MRData']['StandingsTable'].get('StandingsLists', [])
        
        if not standings_list:
            print("No constructor standings data available")
            return
        
        constructor_standings = standings_list[0]['ConstructorStandings']
        
        for standing in constructor_standings:
            constructor = standing['Constructor']
            
            # Find the team
            team = Team.query.filter_by(constructor_id=constructor['constructorId']).first()
            
            if not team:
                print(f"Team not found: {constructor['name']}")
                continue
            
            # Update current position and points
            team.current_position = int(standing['position'])
            team.current_points = float(standing['points'])
            team.race_wins = int(standing['wins'])
            
            db.session.commit()
            print(f"Updated team: {team.name} - Position: {team.current_position}")
        
        print("\nStandings update completed successfully!")

if __name__ == '__main__':
    main() 