#!/usr/bin/env python3
"""
Script to test Elasticsearch connection and create a simple index.
"""
import os
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

def main():
    """Test Elasticsearch connection and create a simple index."""
    print("Loading environment variables...")
    load_dotenv()
    
    # Check if Elasticsearch credentials are set
    cloud_id = os.getenv('ELASTIC_CLOUD_ID')
    api_key = os.getenv('ELASTIC_API_KEY')
    index_prefix = os.getenv('ELASTIC_INDEX_PREFIX', 'f1pulse_test')
    
    if not cloud_id or not api_key:
        print("Error: Elasticsearch credentials are not set in .env file.")
        print("Please update the .env file with your ELASTIC_CLOUD_ID and ELASTIC_API_KEY values.")
        return
    
    print(f"Using cloud_id: {cloud_id[:10]}... (truncated)")
    print(f"Using index_prefix: {index_prefix}")
    
    # Initialize Elasticsearch client
    print("Initializing Elasticsearch client...")
    try:
        es = Elasticsearch(
            cloud_id=cloud_id,
            api_key=api_key,
        )
        
        # Check connection
        if es.ping():
            print("Successfully connected to Elasticsearch!")
        else:
            print("Could not connect to Elasticsearch.")
            return
        
        # Create a test index
        index_name = f"{index_prefix}_test"
        if not es.indices.exists(index=index_name):
            print(f"Creating test index: {index_name}")
            # For serverless, we need to remove the settings
            es.indices.create(
                index=index_name,
                mappings={
                    "properties": {
                        "title": {"type": "text"},
                        "description": {"type": "text"}
                    }
                }
            )
            
            # Index a test document
            print("Indexing a test document...")
            es.index(
                index=index_name,
                id=1,
                document={
                    "title": "Test Document",
                    "description": "This is a test document to verify Elasticsearch connection."
                }
            )
            
            print("Test document indexed successfully!")
        else:
            print(f"Index {index_name} already exists.")
            
            # Search for the test document
            print("Searching for test document...")
            results = es.search(
                index=index_name,
                query={
                    "match": {
                        "title": "Test"
                    }
                }
            )
            
            print(f"Search results: {results['hits']['total']['value']} matches found.")
        
        print("Elasticsearch connection test completed successfully!")
        
    except Exception as e:
        print(f"Error connecting to Elasticsearch: {e}")

if __name__ == '__main__':
    main() 