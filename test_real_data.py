import requests
import json
import sys
from pprint import pprint

def test_api_endpoints():
    """Test the API endpoints to verify they return real data from the database"""
    base_url = "http://localhost:5001/api"
    
    # Test endpoints
    endpoints = [
        "/driver-stats/hamilton",
        "/team-stats/ferrari",
        "/circuit-stats/monza",
        "/race-results/2023/1"
    ]
    
    print("Testing API endpoints for real data...")
    
    for endpoint in endpoints:
        url = base_url + endpoint
        print(f"\nTesting {url}")
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            # Print a summary of the data
            if "driver" in data:
                print(f"Driver: {data['driver']['name']}")
                print(f"Team: {data['team']['name']}")
                print(f"Current position: {data['current_season']['position']}")
                print(f"Points: {data['current_season']['points']}")
                print(f"Career wins: {data['career_stats']['race_wins']}")
            elif "team" in data:
                print(f"Team: {data['team']['name']}")
                print(f"Full name: {data['team']['full_name']}")
                print(f"Current position: {data['current_season']['position']}")
                print(f"Points: {data['current_season']['points']}")
                print(f"Drivers: {len(data['drivers'])}")
            elif "circuit" in data:
                print(f"Circuit: {data['circuit']['name']}")
                print(f"Location: {data['circuit']['location']}, {data['circuit']['country']}")
                print(f"Length: {data['circuit']['length']} km")
                print(f"Previous results: {len(data['previous_results'])}")
            elif "race" in data:
                print(f"Race: {data['race']['name']}")
                print(f"Season: {data['race']['season']}, Round: {data['race']['round']}")
                print(f"Results: {len(data['results'])}")
            
            print("✅ Success: Real data returned")
        except requests.exceptions.RequestException as e:
            print(f"❌ Error: {str(e)}")
        except (KeyError, TypeError) as e:
            print(f"❌ Error in data structure: {str(e)}")
            print("Data received:")
            pprint(data)
    
    print("\nAPI testing complete.")

if __name__ == "__main__":
    test_api_endpoints() 