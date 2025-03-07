#!/usr/bin/env python3
"""
Script to populate Elasticsearch indices with F1 data.
Run this script after setting up your Elasticsearch credentials in the .env file.
"""
import os
import json
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

# Sample data for drivers
SAMPLE_DRIVERS = [
    {
        "id": 1,
        "driver_id": "verstappen",
        "first_name": "Max",
        "last_name": "Verstappen",
        "full_name": "Max Verstappen",
        "code": "VER",
        "number": 1,
        "nationality": "Dutch",
        "current_position": 1,
        "current_points": 353.5,
        "team_name": "Red Bull Racing"
    },
    {
        "id": 2,
        "driver_id": "hamilton",
        "first_name": "Lewis",
        "last_name": "Hamilton",
        "full_name": "Lewis Hamilton",
        "code": "HAM",
        "number": 44,
        "nationality": "British",
        "current_position": 3,
        "current_points": 254.0,
        "team_name": "Ferrari"
    },
    {
        "id": 3,
        "driver_id": "norris",
        "first_name": "Lando",
        "last_name": "Norris",
        "full_name": "Lando Norris",
        "code": "NOR",
        "number": 4,
        "nationality": "British",
        "current_position": 2,
        "current_points": 297.5,
        "team_name": "McLaren"
    },
    {
        "id": 4,
        "driver_id": "leclerc",
        "first_name": "Charles",
        "last_name": "Leclerc",
        "full_name": "Charles Leclerc",
        "code": "LEC",
        "number": 16,
        "nationality": "Monégasque",
        "current_position": 4,
        "current_points": 235.0,
        "team_name": "Ferrari"
    },
    {
        "id": 5,
        "driver_id": "russell",
        "first_name": "George",
        "last_name": "Russell",
        "full_name": "George Russell",
        "code": "RUS",
        "number": 63,
        "nationality": "British",
        "current_position": 5,
        "current_points": 204.0,
        "team_name": "Mercedes"
    }
]

# Sample data for teams
SAMPLE_TEAMS = [
    {
        "id": 1,
        "constructor_id": "red_bull",
        "name": "Red Bull",
        "full_name": "Oracle Red Bull Racing",
        "team_principal": "Christian Horner",
        "base_location": "Milton Keynes, United Kingdom",
        "current_position": 1,
        "current_points": 547.0
    },
    {
        "id": 2,
        "constructor_id": "mclaren",
        "name": "McLaren",
        "full_name": "McLaren F1 Team",
        "team_principal": "Andrea Stella",
        "base_location": "Woking, United Kingdom",
        "current_position": 2,
        "current_points": 510.0
    },
    {
        "id": 3,
        "constructor_id": "ferrari",
        "name": "Ferrari",
        "full_name": "Scuderia Ferrari",
        "team_principal": "Frédéric Vasseur",
        "base_location": "Maranello, Italy",
        "current_position": 3,
        "current_points": 489.0
    },
    {
        "id": 4,
        "constructor_id": "mercedes",
        "name": "Mercedes",
        "full_name": "Mercedes-AMG Petronas F1 Team",
        "team_principal": "Toto Wolff",
        "base_location": "Brackley, United Kingdom",
        "current_position": 4,
        "current_points": 309.0
    },
    {
        "id": 5,
        "constructor_id": "aston_martin",
        "name": "Aston Martin",
        "full_name": "Aston Martin Aramco F1 Team",
        "team_principal": "Mike Krack",
        "base_location": "Silverstone, United Kingdom",
        "current_position": 5,
        "current_points": 86.0
    }
]

# Sample data for circuits
SAMPLE_CIRCUITS = [
    {
        "id": 1,
        "circuit_id": "monaco",
        "name": "Circuit de Monaco",
        "location": "Monte Carlo",
        "country": "Monaco",
        "coordinates": {"lat": 43.7347, "lon": 7.4206}
    },
    {
        "id": 2,
        "circuit_id": "silverstone",
        "name": "Silverstone Circuit",
        "location": "Silverstone",
        "country": "United Kingdom",
        "coordinates": {"lat": 52.0786, "lon": -1.0169}
    },
    {
        "id": 3,
        "circuit_id": "monza",
        "name": "Autodromo Nazionale Monza",
        "location": "Monza",
        "country": "Italy",
        "coordinates": {"lat": 45.6156, "lon": 9.2811}
    },
    {
        "id": 4,
        "circuit_id": "spa",
        "name": "Circuit de Spa-Francorchamps",
        "location": "Stavelot",
        "country": "Belgium",
        "coordinates": {"lat": 50.4372, "lon": 5.9714}
    },
    {
        "id": 5,
        "circuit_id": "suzuka",
        "name": "Suzuka International Racing Course",
        "location": "Suzuka",
        "country": "Japan",
        "coordinates": {"lat": 34.8431, "lon": 136.5414}
    }
]

def main():
    """Set up and populate Elasticsearch indices with F1 data."""
    print("Loading environment variables...")
    load_dotenv()
    
    # Check if Elasticsearch credentials are set
    cloud_id = os.getenv('ELASTIC_CLOUD_ID')
    api_key = os.getenv('ELASTIC_API_KEY')
    index_prefix = os.getenv('ELASTIC_INDEX_PREFIX', 'f1pulse_dev')
    
    if not cloud_id or not api_key:
        print("Error: Elasticsearch credentials are not set in .env file.")
        print("Please update the .env file with your ELASTIC_CLOUD_ID and ELASTIC_API_KEY values.")
        return
    
    print(f"Using index prefix: {index_prefix}")
    
    # Initialize Elasticsearch client
    print("Initializing Elasticsearch client...")
    try:
        es = Elasticsearch(
            cloud_id=cloud_id,
            api_key=api_key,
        )
        
        if not es.ping():
            print("Error: Could not connect to Elasticsearch.")
            return
            
        print("Successfully connected to Elasticsearch!")
        
        # Index data
        print("Populating Elasticsearch indices with data...")
        
        # Index drivers
        drivers_index = f"{index_prefix}_drivers"
        if es.indices.exists(index=drivers_index):
            print(f"Indexing drivers to {drivers_index}...")
            for driver in SAMPLE_DRIVERS:
                es.index(
                    index=drivers_index,
                    id=driver["id"],
                    document=driver
                )
            print(f"Successfully indexed {len(SAMPLE_DRIVERS)} drivers.")
        else:
            print(f"Error: Index {drivers_index} does not exist. Run 'python3 elastic_manager.py setup' first.")
        
        # Index teams
        teams_index = f"{index_prefix}_teams"
        if es.indices.exists(index=teams_index):
            print(f"Indexing teams to {teams_index}...")
            for team in SAMPLE_TEAMS:
                es.index(
                    index=teams_index,
                    id=team["id"],
                    document=team
                )
            print(f"Successfully indexed {len(SAMPLE_TEAMS)} teams.")
        else:
            print(f"Error: Index {teams_index} does not exist. Run 'python3 elastic_manager.py setup' first.")
        
        # Index circuits
        circuits_index = f"{index_prefix}_circuits"
        if es.indices.exists(index=circuits_index):
            print(f"Indexing circuits to {circuits_index}...")
            for circuit in SAMPLE_CIRCUITS:
                es.index(
                    index=circuits_index,
                    id=circuit["id"],
                    document=circuit
                )
            print(f"Successfully indexed {len(SAMPLE_CIRCUITS)} circuits.")
        else:
            print(f"Error: Index {circuits_index} does not exist. Run 'python3 elastic_manager.py setup' first.")
        
        print("Elasticsearch data population completed!")
        print("You can now use the search functionality in the application.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main() 