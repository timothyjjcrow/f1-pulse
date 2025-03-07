import logging
from elasticsearch import Elasticsearch
from flask import current_app

logger = logging.getLogger(__name__)

class ElasticsearchService:
    """Service to interact with Elasticsearch"""
    
    def __init__(self):
        self.client = None
        self.index_prefix = None
        
    def initialize(self, app=None):
        """Initialize the Elasticsearch client"""
        if app is None:
            cloud_id = current_app.config.get('ELASTIC_CLOUD_ID')
            api_key = current_app.config.get('ELASTIC_API_KEY')
            self.index_prefix = current_app.config.get('ELASTIC_INDEX_PREFIX', 'f1pulse')
        else:
            cloud_id = app.config.get('ELASTIC_CLOUD_ID')
            api_key = app.config.get('ELASTIC_API_KEY')
            self.index_prefix = app.config.get('ELASTIC_INDEX_PREFIX', 'f1pulse')
        
        if not cloud_id or not api_key:
            logger.warning("Elasticsearch credentials not found. Search functionality will be limited.")
            return False
        
        try:
            self.client = Elasticsearch(
                cloud_id=cloud_id,
                api_key=api_key,
            )
            logger.info("Elasticsearch client initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Elasticsearch client: {str(e)}")
            return False
    
    def get_index_name(self, index_type):
        """Get the full index name with prefix"""
        return f"{self.index_prefix}_{index_type}"
    
    def create_index(self, index_type, mappings):
        """Create an index with the given mappings"""
        if not self.client:
            logger.error("Elasticsearch client not initialized")
            return False
        
        index_name = self.get_index_name(index_type)
        
        try:
            if not self.client.indices.exists(index=index_name):
                self.client.indices.create(
                    index=index_name,
                    body={"mappings": mappings},
                )
                logger.info(f"Created index {index_name}")
            return True
        except Exception as e:
            logger.error(f"Error creating index {index_name}: {str(e)}")
            return False
    
    def index_document(self, index_type, doc_id, document):
        """Index a document"""
        if not self.client:
            logger.error("Elasticsearch client not initialized")
            return False
        
        index_name = self.get_index_name(index_type)
        
        try:
            self.client.index(
                index=index_name,
                id=doc_id,
                document=document,
            )
            return True
        except Exception as e:
            logger.error(f"Error indexing document: {str(e)}")
            return False
    
    def search(self, index_type, query, size=10):
        """Search for documents in the index"""
        if not self.client:
            logger.error("Elasticsearch client not initialized")
            return []
        
        index_name = self.get_index_name(index_type)
        
        try:
            response = self.client.search(
                index=index_name,
                body=query,
                size=size,
            )
            return response.get('hits', {}).get('hits', [])
        except Exception as e:
            logger.error(f"Error searching in index {index_name}: {str(e)}")
            return []
    
    def delete_document(self, index_type, doc_id):
        """Delete a document from the index"""
        if not self.client:
            logger.error("Elasticsearch client not initialized")
            return False
        
        index_name = self.get_index_name(index_type)
        
        try:
            self.client.delete(
                index=index_name,
                id=doc_id,
            )
            return True
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            return False 