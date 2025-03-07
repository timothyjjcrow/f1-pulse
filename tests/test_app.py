import pytest
from app import create_app
from app.services.ergast_api import ErgastAPI
import os

@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    app = create_app('testing')
    yield app

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test CLI runner for the app."""
    return app.test_cli_runner()

def test_home_page(client):
    """Test that the home page loads."""
    response = client.get('/')
    assert response.status_code == 200
    assert b'F1 Pulse' in response.data

def test_drivers_page(client):
    """Test that the drivers page loads."""
    response = client.get('/drivers')
    assert response.status_code == 200
    assert b'F1 Drivers' in response.data

def test_teams_page(client):
    """Test that the teams page loads."""
    response = client.get('/teams')
    assert response.status_code == 200
    assert b'F1 Teams' in response.data

def test_races_page(client):
    """Test that the races page loads."""
    response = client.get('/races')
    assert response.status_code == 200
    assert b'F1 Race Calendar' in response.data

def test_standings_page(client):
    """Test that the standings page loads."""
    response = client.get('/standings')
    assert response.status_code == 200
    assert b'F1 Championship Standings' in response.data

def test_pit_stop_challenge_page(client):
    """Test that the pit stop challenge page loads."""
    response = client.get('/pit-stop-challenge')
    assert response.status_code == 200
    assert b'Virtual Pit Stop Challenge' in response.data

def test_about_page(client):
    """Test that the about page loads."""
    response = client.get('/about')
    assert response.status_code == 200
    assert b'About F1 Pulse' in response.data

def test_api_endpoints(client):
    """Test that the API endpoints return valid responses."""
    endpoints = [
        '/api/next-race',
        '/api/last-race',
        '/api/drivers',
        '/api/teams',
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code == 200
        assert response.json is not None

def test_ergast_api():
    """Test the ErgastAPI client with basic requests."""
    # Skip this test if no internet connection
    try:
        import requests
        requests.get('http://ergast.com', timeout=5)
    except (requests.ConnectionError, requests.Timeout):
        pytest.skip("No internet connection or Ergast API is not accessible")
    
    # Create the API client
    api = ErgastAPI()
    
    # Test getting the current season
    data = api.get_current_season()
    assert data is not None
    assert 'MRData' in data
    assert 'RaceTable' in data['MRData']
    
    # Test getting driver standings
    data = api.get_drivers_standings()
    assert data is not None
    assert 'MRData' in data
    assert 'StandingsTable' in data['MRData']
    
    # Test getting constructor standings
    data = api.get_constructors_standings()
    assert data is not None
    assert 'MRData' in data
    assert 'StandingsTable' in data['MRData'] 