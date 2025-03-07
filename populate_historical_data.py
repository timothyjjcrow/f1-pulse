#!/usr/bin/env python3
"""
Script to populate the F1 Pulse database with historical F1 data (40 years).
This script systematically imports data from the Ergast API for seasons from 1984 to 2024.
"""

import os
import sys
import argparse
import logging
import time
from tqdm import tqdm
from dotenv import load_dotenv
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('historical_import.log')
    ]
)

logger = logging.getLogger(__name__)

def main():
    """Main entry point for the script."""
    # Load environment variables
    load_dotenv()
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Populate F1 Pulse database with historical F1 data (40 years).')
    parser.add_argument('--env', choices=['development', 'testing', 'production'], default='development',
                      help='Environment to run in (default: development)')
    parser.add_argument('--start-year', type=int, default=1984,
                      help='Start year for historical data (default: 1984)')
    parser.add_argument('--end-year', type=int, default=2024,
                      help='End year for historical data (default: 2024)')
    parser.add_argument('--data-type', choices=['drivers', 'teams', 'races', 'results', 'all'], default='all',
                      help='Type of historical data to import (default: all)')
    parser.add_argument('--skip-elasticsearch', action='store_true',
                      help='Skip Elasticsearch indexing')
    parser.add_argument('--batch-size', type=int, default=3,
                      help='Number of years to process in a batch before pausing (default: 3)')
    parser.add_argument('--batch-pause', type=int, default=5,
                      help='Seconds to pause between batches to avoid API rate limits (default: 5)')
    
    args = parser.parse_args()
    
    # Set environment
    os.environ['FLASK_ENV'] = args.env
    
    # Import the app and services (import here to use the correct environment)
    from app import create_app, db
    from app.utils.historical_data_populator import HistoricalDataPopulator

    # Create the app with the specified environment
    app = create_app(args.env)
    
    # Check if Elasticsearch is configured
    elastic_configured = bool(app.config.get('ELASTIC_CLOUD_ID') and app.config.get('ELASTIC_API_KEY'))
    if not elastic_configured and not args.skip_elasticsearch:
        logger.warning("Elasticsearch credentials not found. Skipping Elasticsearch indexing.")
        args.skip_elasticsearch = True
    
    try:
        # Process historical data
        with app.app_context():
            # Ensure database tables exist
            db.create_all()
            
            # Create the historical data populator
            populator = HistoricalDataPopulator(app)
            
            # Calculate the year range
            years = list(range(args.start_year, args.end_year + 1))
            
            logger.info(f"Starting historical data import for years {args.start_year}-{args.end_year}")
            
            # Process years in batches with progress bar
            year_batches = [years[i:i + args.batch_size] for i in range(0, len(years), args.batch_size)]
            
            with tqdm(total=len(years), desc="Importing F1 historical data") as pbar:
                for batch in year_batches:
                    for year in batch:
                        if args.data_type == 'all' or args.data_type == 'teams':
                            logger.info(f"Importing team data for {year}")
                            populator.populate_teams_for_year(year)
                            
                        if args.data_type == 'all' or args.data_type == 'drivers':
                            logger.info(f"Importing driver data for {year}")
                            populator.populate_drivers_for_year(year)
                            
                        if args.data_type == 'all' or args.data_type == 'races':
                            logger.info(f"Importing races data for {year}")
                            populator.populate_races_for_year(year)
                            
                        if args.data_type == 'all' or args.data_type == 'results':
                            logger.info(f"Importing race results for {year}")
                            populator.populate_results_for_year(year)
                            
                        # Update progress bar
                        pbar.update(1)
                    
                    # Pause between batches to avoid hitting API rate limits
                    if len(year_batches) > 1 and batch != year_batches[-1]:
                        time.sleep(args.batch_pause)
            
            # Populate Elasticsearch if not skipped and configured
            if not args.skip_elasticsearch:
                logger.info("Setting up Elasticsearch indices")
                populator.setup_elasticsearch_indices()
                
                logger.info("Indexing historical data in Elasticsearch")
                populator.index_all_data()
            
            logger.info("Historical data import completed successfully")
        
    except Exception as e:
        logger.error(f"Error importing historical data: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)

if __name__ == '__main__':
    main() 