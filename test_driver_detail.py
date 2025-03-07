import requests
import json
import sys
from flask import Flask
from app import create_app, db
from app.models.driver import Driver
from app.models.team import Team
from app.services.ergast_api import ErgastAPI

def main():
    """
    Test the driver detail page updates by checking the API endpoint.
    """
    # Create the Flask app with the application context
    app = create_app('development')
    
    with app.app_context():
        # Get a driver ID from the database
        driver = Driver.query.filter(Driver.driver_id.isnot(None)).first()
        
        if not driver:
            print("No driver found in the database with a valid driver_id.")
            return
            
        print(f"Testing with driver: {driver.first_name} {driver.last_name} (ID: {driver.driver_id})")
        
        # Make a request to our new API endpoint
        url = f"http://localhost:5000/api/driver-stats/{driver.driver_id}"
        print(f"Making request to: {url}")
        
        try:
            # Don't actually make the request, as we're not running the server
            # Instead, simulate the API call directly
            
            print("\nSimulating API call directly...")
            from app.controllers.api import driver_stats
            with app.test_request_context():
                # Directly call the function
                response = driver_stats(driver.driver_id)
                
                # Parse the response
                result = json.loads(response.get_data(as_text=True))
                
                # Print the result in a readable format
                print("\nAPI Response:")
                print(f"Driver: {result.get('driver', {}).get('name')}")
                print(f"Team: {result.get('team', {}).get('name')}")
                print(f"Current Position: {result.get('current_season', {}).get('position')}")
                print(f"Current Points: {result.get('current_season', {}).get('points')}")
                
                print("\nCareer Stats:")
                career = result.get('career_stats', {})
                print(f"Championships: {career.get('championships')}")
                print(f"Race Wins: {career.get('race_wins')}")
                print(f"Podiums: {career.get('podiums')}")
                print(f"Pole Positions: {career.get('pole_positions')}")
                print(f"Fastest Laps: {career.get('fastest_laps')}")
                
                # Check if we have recent races data
                print("\nRecent Races:")
                recent_races = result.get('recent_races', {})
                if recent_races and 'MRData' in recent_races:
                    races = recent_races.get('MRData', {}).get('RaceTable', {}).get('Races', [])
                    if races:
                        for race in races[:3]:  # Print first 3 races
                            result = race.get('Results', [{}])[0] if race.get('Results') else {}
                            print(f"{race.get('raceName')}: Position {result.get('position', 'N/A')}, Points {result.get('points', '0')}")
                    else:
                        print("No race results found.")
                else:
                    print("No recent races data available.")
                    
        except Exception as e:
            print(f"Error occurred: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main() 