import requests
import logging
from flask import current_app
from functools import wraps
import time
import json

logger = logging.getLogger(__name__)

def rate_limited(max_per_second):
    """Decorator to limit API calls to a certain rate"""
    min_interval = 1.0 / max_per_second
    
    def decorator(func):
        last_time_called = [0.0]
        
        @wraps(func)
        def rate_limited_function(*args, **kwargs):
            elapsed = time.time() - last_time_called[0]
            left_to_wait = min_interval - elapsed
            
            if left_to_wait > 0:
                time.sleep(left_to_wait)
                
            ret = func(*args, **kwargs)
            last_time_called[0] = time.time()
            return ret
            
        return rate_limited_function
    
    return decorator


class ErgastAPI:
    """Service to interact with the Ergast F1 API"""
    
    def __init__(self, base_url=None):
        self._base_url = base_url
    
    @property
    def base_url(self):
        """Property to lazily load the base_url from config when needed"""
        if self._base_url is None:
            self._base_url = current_app.config.get('ERGAST_API_URL', 'http://ergast.com/api/f1')
        return self._base_url
    
    @rate_limited(5)  # Limit to 5 requests per second to be respectful to the API
    def _make_request(self, endpoint, params=None):
        """Make a request to the Ergast API with rate limiting"""
        url = f"{self.base_url}/{endpoint}.json"
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching data from Ergast API: {str(e)}")
            return None
    
    def get_current_season(self):
        """Get the current F1 season schedule"""
        return self._make_request("current")
    
    def get_drivers_standings(self, season='current'):
        """Get driver standings for a given season"""
        return self._make_request(f"{season}/driverStandings")
    
    def get_constructors_standings(self, season='current'):
        """Get constructor standings for a given season"""
        return self._make_request(f"{season}/constructorStandings")
    
    def get_race_results(self, season, round_num):
        """Get results for a specific race"""
        return self._make_request(f"{season}/{round_num}/results")
    
    def get_qualifying_results(self, season, round_num):
        """Get qualifying results for a specific race"""
        return self._make_request(f"{season}/{round_num}/qualifying")
    
    def get_driver_info(self, driver_id):
        """Get information about a specific driver"""
        return self._make_request(f"drivers/{driver_id}")
    
    def get_team_info(self, constructor_id):
        """Get information about a specific team/constructor"""
        return self._make_request(f"constructors/{constructor_id}")
    
    def get_circuit_info(self, circuit_id):
        """Get information about a specific circuit"""
        return self._make_request(f"circuits/{circuit_id}")
    
    def get_driver_races(self, driver_id, season=None):
        """Get races for a specific driver, optionally filtered by season"""
        endpoint = f"drivers/{driver_id}/results"
        if season:
            endpoint = f"{season}/drivers/{driver_id}/results"
        return self._make_request(endpoint)
    
    def get_next_race(self):
        """Get information about the next race"""
        return self._make_request("current/next")
    
    def get_last_race(self):
        """Get information about the last race"""
        return self._make_request("current/last")
    
    def get_season_races(self, season='current'):
        """Get all races in a season"""
        return self._make_request(f"{season}")
    
    def get_lap_times(self, season, round_num, lap=None, driver_id=None):
        """Get lap times for a specific race, optionally filtered by lap number or driver"""
        endpoint = f"{season}/{round_num}/laps"
        
        if lap:
            endpoint = f"{endpoint}/{lap}"
        
        if driver_id:
            endpoint = f"{endpoint}/drivers/{driver_id}"
            
        return self._make_request(endpoint) 