#!/usr/bin/env python3
"""
Elasticsearch management utility for F1 Pulse.
This script helps manage Elasticsearch indices for different environments.
"""
import os
import argparse
import sys
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

def setup_cli():
    """Set up command line interface."""
    parser = argparse.ArgumentParser(
        description='F1 Pulse Elasticsearch Management Utility',
        formatter_class=argparse.RawTextHelpFormatter
    )
    
    parser.add_argument('--env', '-e', 
                        choices=['dev', 'prod'], 
                        default='dev',
                        help='Environment to work with (dev or prod)')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Setup command
    setup_parser = subparsers.add_parser('setup', help='Set up Elasticsearch indices')
    
    # List indices command
    list_parser = subparsers.add_parser('list', help='List Elasticsearch indices')
    
    # Delete indices command
    delete_parser = subparsers.add_parser('delete', help='Delete Elasticsearch indices')
    delete_parser.add_argument('index_type', nargs='?', choices=['drivers', 'teams', 'circuits', 'all'],
                              help='Type of index to delete (or "all" for all indices)')
    
    return parser.parse_args()

def main():
    """Main function."""
    args = setup_cli()
    
    # Load environment variables from .env file
    load_dotenv()
    
    # Check if Elasticsearch credentials are set
    cloud_id = os.getenv('ELASTIC_CLOUD_ID')
    api_key = os.getenv('ELASTIC_API_KEY')
    
    if not cloud_id or not api_key:
        print("Error: Elasticsearch credentials are not set in .env file.")
        print("Please update the .env file with your ELASTIC_CLOUD_ID and ELASTIC_API_KEY values.")
        sys.exit(1)
    
    # Set the index prefix based on environment
    if args.env == 'dev':
        index_prefix = os.getenv('ELASTIC_INDEX_PREFIX', 'f1pulse_dev')
    else:
        index_prefix = 'f1pulse_prod'
    
    print(f"Working with environment: {args.env}")
    print(f"Using index prefix: {index_prefix}")
    
    # Initialize Elasticsearch client
    try:
        es = Elasticsearch(
            cloud_id=cloud_id,
            api_key=api_key,
        )
        
        if not es.ping():
            print("Error: Could not connect to Elasticsearch.")
            sys.exit(1)
            
        print("Successfully connected to Elasticsearch!")
        
        # Execute the requested command
        if args.command == 'setup':
            setup_indices(es, index_prefix)
        elif args.command == 'list':
            list_indices(es, index_prefix)
        elif args.command == 'delete':
            delete_indices(es, index_prefix, args.index_type)
        else:
            print("Please specify a command. Use --help for more information.")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def get_index_name(prefix, index_type):
    """Get the full index name with prefix."""
    return f"{prefix}_{index_type}"

def setup_indices(es, index_prefix):
    """Set up Elasticsearch indices."""
    print("Setting up Elasticsearch indices...")
    
    # Driver index mapping
    driver_mapping = {
        "properties": {
            "id": {"type": "integer"},
            "driver_id": {"type": "keyword"},
            "first_name": {"type": "text"},
            "last_name": {"type": "text"},
            "full_name": {"type": "text"},
            "code": {"type": "keyword"},
            "number": {"type": "integer"},
            "nationality": {"type": "keyword"},
            "current_position": {"type": "integer"},
            "current_points": {"type": "float"},
            "team_name": {"type": "text"}
        }
    }
    
    # Team index mapping
    team_mapping = {
        "properties": {
            "id": {"type": "integer"},
            "constructor_id": {"type": "keyword"},
            "name": {"type": "text"},
            "full_name": {"type": "text"},
            "team_principal": {"type": "text"},
            "base_location": {"type": "text"},
            "current_position": {"type": "integer"},
            "current_points": {"type": "float"}
        }
    }
    
    # Circuit index mapping
    circuit_mapping = {
        "properties": {
            "id": {"type": "integer"},
            "circuit_id": {"type": "keyword"},
            "name": {"type": "text"},
            "location": {"type": "text"},
            "country": {"type": "keyword"},
            "coordinates": {"type": "geo_point"}
        }
    }
    
    # Create indices
    indices = {
        "drivers": driver_mapping,
        "teams": team_mapping,
        "circuits": circuit_mapping
    }
    
    for index_type, mapping in indices.items():
        index_name = get_index_name(index_prefix, index_type)
        if not es.indices.exists(index=index_name):
            print(f"Creating index: {index_name}")
            es.indices.create(
                index=index_name,
                mappings=mapping
            )
            print(f"Index {index_name} created successfully.")
        else:
            print(f"Index {index_name} already exists.")
    
    print("Elasticsearch indices setup completed.")

def list_indices(es, index_prefix):
    """List Elasticsearch indices."""
    try:
        indices = es.indices.get(index=f"{index_prefix}_*")
        
        if not indices:
            print("No indices found.")
            return
        
        print("\nElasticsearch Indices:")
        print("---------------------")
        for index_name in sorted(indices.keys()):
            print(f"- {index_name}")
        print()
    except Exception as e:
        print(f"Error listing indices: {e}")

def delete_indices(es, index_prefix, index_type):
    """Delete Elasticsearch indices."""
    try:
        if index_type == 'all':
            pattern = f"{index_prefix}_*"
            print(f"Deleting all indices with pattern: {pattern}")
            es.indices.delete(index=pattern, ignore_unavailable=True)
            print("All indices deleted.")
        else:
            index_name = get_index_name(index_prefix, index_type)
            print(f"Deleting index: {index_name}")
            es.indices.delete(index=index_name, ignore_unavailable=True)
            print(f"Index {index_name} deleted.")
    except Exception as e:
        print(f"Error deleting indices: {e}")

if __name__ == '__main__':
    main() 