import os

class Config:
    """Base configuration class"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    ERGAST_API_URL = os.getenv('ERGAST_API_URL', 'http://ergast.com/api/f1')
    ELASTIC_CLOUD_ID = os.getenv('ELASTIC_CLOUD_ID')
    ELASTIC_API_KEY = os.getenv('ELASTIC_API_KEY')


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///dev.db')
    ELASTIC_INDEX_PREFIX = os.getenv('ELASTIC_INDEX_PREFIX', 'f1pulse_dev')


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv('TEST_DATABASE_URL', 'sqlite:///test.db')
    ELASTIC_INDEX_PREFIX = 'f1pulse_test'


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    ELASTIC_INDEX_PREFIX = os.getenv('ELASTIC_INDEX_PREFIX', 'f1pulse_prod') 