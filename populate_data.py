#!/usr/bin/env python3
"""
Script to populate the F1 Pulse database with data from the Ergast API.
"""

import os
import sys
import argparse
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def main():
    """Main entry point for the script."""
    # Load environment variables
    load_dotenv()
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Populate F1 Pulse database with data from the Ergast API.')
    parser.add_argument('--env', choices=['development', 'testing', 'production'], default='development',
                      help='Environment to run in (default: development)')
    parser.add_argument('--skip-elasticsearch', action='store_true',
                      help='Skip Elasticsearch indexing')
    parser.add_argument('--only', choices=['teams', 'drivers', 'circuits', 'races', 'all'], default='all',
                      help='Only populate specific data (default: all)')
    parser.add_argument('--force', action='store_true',
                      help='Force update existing data')
    
    args = parser.parse_args()
    
    # Set environment
    os.environ['FLASK_ENV'] = args.env
    
    # Import the app and services (import here to use the correct environment)
    from app import create_app, db
    from app.utils.data_populator import DataPopulator
    
    # Create the app with the specified environment
    app = create_app(args.env)
    
    # Check if Elasticsearch is configured
    elastic_configured = bool(app.config.get('ELASTIC_CLOUD_ID') and app.config.get('ELASTIC_API_KEY'))
    if not elastic_configured and not args.skip_elasticsearch:
        logger.warning("Elasticsearch credentials not found. Skipping Elasticsearch indexing.")
        args.skip_elasticsearch = True
    
    # Create the data populator
    populator = DataPopulator(app)
    
    try:
        # Populate data based on command line arguments
        with app.app_context():
            # Ensure database tables exist
            db.create_all()
            
            if args.only == 'all':
                logger.info(f"Populating all data in {args.env} environment")
                
                # Populate database tables
                populator.populate_teams(force_update=args.force)
                populator.populate_drivers(force_update=args.force)
                populator.populate_circuits(force_update=args.force)
                populator.populate_races(force_update=args.force)
                
                # Populate Elasticsearch if not skipped and configured
                if not args.skip_elasticsearch:
                    populator.setup_elasticsearch_indices()
                    populator.index_all_data()
            else:
                logger.info(f"Populating {args.only} data in {args.env} environment")
                
                if args.only == 'teams':
                    populator.populate_teams(force_update=args.force)
                    if not args.skip_elasticsearch:
                        populator.setup_elasticsearch_indices()
                        populator.index_teams()
                elif args.only == 'drivers':
                    populator.populate_drivers(force_update=args.force)
                    if not args.skip_elasticsearch:
                        populator.setup_elasticsearch_indices()
                        populator.index_drivers()
                elif args.only == 'circuits':
                    populator.populate_circuits(force_update=args.force)
                    if not args.skip_elasticsearch:
                        populator.setup_elasticsearch_indices()
                        populator.index_circuits()
                elif args.only == 'races':
                    populator.populate_races(force_update=args.force)
        
        logger.info("Data population completed successfully")
        
    except Exception as e:
        logger.error(f"Error populating data: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main() 