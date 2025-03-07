import logging
import requests
from datetime import datetime
from app import db
from app.models import Driver, Team, Circuit, Race
from app.services.ergast_api import ErgastAPI
from app.services.elasticsearch_service import ElasticsearchService

logger = logging.getLogger(__name__)

class HistoricalDataPopulator:
    """Utility for populating the database with historical F1 data from the Ergast API"""
    
    def __init__(self, app):
        self.app = app
        self.ergast_api = ErgastAPI()
        self.es_service = ElasticsearchService()
        self.es_service.initialize(app)
        
        # Driver championships by driver ID (to be populated during data import)
        self.driver_championships = {}
        # Constructor/team championships by constructor ID
        self.team_championships = {}
        
        # Cache for drivers and teams to minimize database queries
        self.driver_cache = {}
        self.team_cache = {}
        
    def populate_teams_for_year(self, year):
        """Populate team/constructor data for a specific year"""
        logger.info(f"Populating team data for {year}...")
        
        # Get constructor standings for the year
        data = self.ergast_api.get_constructors_standings(str(year))
        
        if not data or 'MRData' not in data:
            logger.warning(f"Failed to retrieve constructor standings for {year}")
            return
        
        standings_table = data['MRData']['StandingsTable']
        
        if not standings_table.get('StandingsLists'):
            logger.warning(f"No constructor standings data available for {year}")
            return
        
        standings_list = standings_table['StandingsLists'][0]
        constructor_standings = standings_list.get('ConstructorStandings', [])
        
        # Check if this season has a champion (position 1)
        for standing in constructor_standings:
            constructor = standing['Constructor']
            constructor_id = constructor['constructorId']
            position = int(standing['position'])
            
            # Track championships
            if position == 1:
                if constructor_id in self.team_championships:
                    self.team_championships[constructor_id] += 1
                else:
                    self.team_championships[constructor_id] = 1
        
        # Now process each constructor and update their data
        for standing in constructor_standings:
            constructor = standing['Constructor']
            
            # Check if team already exists
            team = self._get_team(constructor['constructorId'])
            
            # If team doesn't exist, create it
            if not team:
                team = Team(
                    name=constructor['name'],
                    full_name=constructor.get('name', constructor['name']),
                    constructor_id=constructor['constructorId'],
                )
                logger.info(f"Creating team {team.name}")
                db.session.add(team)
                self.team_cache[team.constructor_id] = team
            
            # Update historical stats
            team.championships = self.team_championships.get(team.constructor_id, 0)
            
            # Only update current position and points if it's the current year (2024)
            if year == 2024:
                team.current_position = int(standing['position'])
                team.current_points = float(standing['points'])
                team.race_wins = int(standing['wins'])
            
            # Update win count for historical seasons
            if 'wins' in standing:
                team.race_wins = (team.race_wins or 0) + int(standing['wins'])
            
            # Set or update first entry year
            if not team.first_entry_year or year < team.first_entry_year:
                team.first_entry_year = year
            
            # Save to database
            db.session.commit()
        
        logger.info(f"Teams data for {year} populated successfully")
    
    def populate_drivers_for_year(self, year):
        """Populate driver data for a specific year"""
        logger.info(f"Populating driver data for {year}...")
        
        # Get driver standings for the year
        data = self.ergast_api.get_drivers_standings(str(year))
        
        if not data or 'MRData' not in data:
            logger.warning(f"Failed to retrieve driver standings for {year}")
            return
        
        standings_table = data['MRData']['StandingsTable']
        
        if not standings_table.get('StandingsLists'):
            logger.warning(f"No driver standings data available for {year}")
            return
        
        standings_list = standings_table['StandingsLists'][0]
        driver_standings = standings_list.get('DriverStandings', [])
        
        # Check if this season has a champion (position 1)
        for standing in driver_standings:
            driver_data = standing['Driver']
            driver_id = driver_data['driverId']
            position = int(standing['position'])
            
            # Track championships
            if position == 1:
                if driver_id in self.driver_championships:
                    self.driver_championships[driver_id] += 1
                else:
                    self.driver_championships[driver_id] = 1
        
        # Now process each driver and update their data
        for standing in driver_standings:
            driver_data = standing['Driver']
            
            # Get team for this driver in this season
            constructor = None
            if 'Constructors' in standing and standing['Constructors']:
                constructor = standing['Constructors'][0]
            
            # Get or create driver
            driver = self._get_driver(driver_data['driverId'])
            
            if not driver:
                # Create new driver
                driver = Driver(
                    first_name=driver_data['givenName'],
                    last_name=driver_data['familyName'],
                    code=driver_data.get('code', ''),
                    number=driver_data.get('permanentNumber', None),
                    driver_id=driver_data['driverId'],
                    nationality=driver_data.get('nationality', ''),
                    date_of_birth=datetime.strptime(driver_data.get('dateOfBirth', '1900-01-01'), '%Y-%m-%d').date() if 'dateOfBirth' in driver_data else None,
                )
                logger.info(f"Creating driver {driver.first_name} {driver.last_name}")
                db.session.add(driver)
                self.driver_cache[driver.driver_id] = driver
            
            # Update driver historical stats
            driver.championships = self.driver_championships.get(driver.driver_id, 0)
            
            # Only update current position and points if it's the current year (2024)
            if year == 2024 and constructor:
                # Get team
                team = self._get_team(constructor['constructorId'])
                
                if team:
                    driver.team_id = team.id
                
                driver.current_position = int(standing['position'])
                driver.current_points = float(standing['points'])
            
            # Update win count for historical seasons
            if 'wins' in standing:
                driver.race_wins = (driver.race_wins or 0) + int(standing['wins'])
            
            # Update podiums and pole positions (would need to be calculated from race results)
            # We'll do this in the populate_results_for_year method
            
            # Set or update first race year
            if not driver.first_race_year or year < driver.first_race_year:
                driver.first_race_year = year
            
            # Save to database
            db.session.commit()
        
        logger.info(f"Drivers data for {year} populated successfully")
    
    def populate_races_for_year(self, year):
        """Populate race data for a specific year"""
        logger.info(f"Populating races data for {year}...")
        
        # Get season races
        data = self.ergast_api.get_season_races(str(year))
        
        if not data or 'MRData' not in data:
            logger.warning(f"Failed to retrieve season races for {year}")
            return
        
        races_data = data['MRData']['RaceTable']['Races']
        
        if not races_data:
            logger.warning(f"No races found for {year}")
            return
        
        for race_data in races_data:
            # Process circuit first
            circuit_data = race_data['Circuit']
            
            # Find or create circuit
            circuit = Circuit.query.filter_by(circuit_id=circuit_data['circuitId']).first()
            
            if not circuit:
                circuit = Circuit(
                    name=circuit_data['circuitName'],
                    circuit_id=circuit_data['circuitId'],
                    location=circuit_data['Location'].get('locality', ''),
                    country=circuit_data['Location'].get('country', ''),
                    latitude=float(circuit_data['Location'].get('lat', 0)),
                    longitude=float(circuit_data['Location'].get('long', 0)),
                )
                logger.info(f"Creating circuit {circuit.name}")
                db.session.add(circuit)
                db.session.commit()
            
            # Create race ID that's unique for each season and round
            race_id = f"{race_data['season']}-{race_data['round']}"
            
            # Check if race already exists
            race = Race.query.filter_by(race_id=race_id).first()
            
            # Parse dates
            try:
                race_date = datetime.strptime(f"{race_data['date']} {race_data.get('time', '00:00:00Z')}", '%Y-%m-%d %H:%M:%SZ')
                qualifying_date = None
                sprint_date = None
                fp1_date = None
                fp2_date = None
                fp3_date = None
                
                if 'Qualifying' in race_data:
                    qualifying_date = datetime.strptime(f"{race_data['Qualifying']['date']} {race_data['Qualifying'].get('time', '00:00:00Z')}", '%Y-%m-%d %H:%M:%SZ')
                
                if 'Sprint' in race_data:
                    sprint_date = datetime.strptime(f"{race_data['Sprint']['date']} {race_data['Sprint'].get('time', '00:00:00Z')}", '%Y-%m-%d %H:%M:%SZ')
                
                if 'FirstPractice' in race_data:
                    fp1_date = datetime.strptime(f"{race_data['FirstPractice']['date']} {race_data['FirstPractice'].get('time', '00:00:00Z')}", '%Y-%m-%d %H:%M:%SZ')
                
                if 'SecondPractice' in race_data:
                    fp2_date = datetime.strptime(f"{race_data['SecondPractice']['date']} {race_data['SecondPractice'].get('time', '00:00:00Z')}", '%Y-%m-%d %H:%M:%SZ')
                
                if 'ThirdPractice' in race_data:
                    fp3_date = datetime.strptime(f"{race_data['ThirdPractice']['date']} {race_data['ThirdPractice'].get('time', '00:00:00Z')}", '%Y-%m-%d %H:%M:%SZ')
            except Exception as e:
                logger.error(f"Error parsing dates for race {race_data['raceName']} ({year}): {str(e)}")
                continue
            
            # Set status based on year and current date
            current_time = datetime.utcnow()
            
            if year < 2024 or (year == 2024 and race_date < current_time):
                status = 'completed'
            elif year == 2024 and ((qualifying_date and qualifying_date < current_time) or 
                                   (sprint_date and sprint_date < current_time) or 
                                   (fp1_date and fp1_date < current_time)):
                status = 'in_progress'
            else:
                status = 'upcoming'
            
            # Create or update race
            if not race:
                race = Race(
                    name=race_data['raceName'],
                    race_id=race_id,
                    season=int(race_data['season']),
                    round=int(race_data['round']),
                    race_date=race_date,
                    qualifying_date=qualifying_date,
                    sprint_date=sprint_date,
                    fp1_date=fp1_date,
                    fp2_date=fp2_date,
                    fp3_date=fp3_date,
                    status=status,
                    circuit_id=circuit.id
                )
                logger.info(f"Creating race {race.name} (Season {race.season}, Round {race.round})")
                db.session.add(race)
            else:
                logger.info(f"Updating race {race.name} (Season {race.season}, Round {race.round})")
                race.name = race_data['raceName']
                race.race_date = race_date
                race.qualifying_date = qualifying_date
                race.sprint_date = sprint_date
                race.fp1_date = fp1_date
                race.fp2_date = fp2_date
                race.fp3_date = fp3_date
                race.status = status
                race.circuit_id = circuit.id
            
            # Save to database
            db.session.commit()
        
        logger.info(f"Races data for {year} populated successfully")
    
    def populate_results_for_year(self, year):
        """Populate race results for a specific year to calculate stats like podiums, poles, fastest laps"""
        logger.info(f"Populating race results for {year}...")
        
        # Get all races for the year
        races = Race.query.filter_by(season=year).all()
        
        if not races:
            logger.warning(f"No races found for {year}")
            return
        
        # Track podium counts, pole positions, and fastest laps for this year
        year_podiums = {}  # Driver ID -> podium count
        year_poles = {}    # Driver ID -> pole count
        year_fastest_laps = {}  # Driver ID -> fastest lap count
        
        for race in races:
            # Get qualifying results to track pole positions
            qualifying_data = self.ergast_api.get_qualifying_results(str(year), str(race.round))
            
            if qualifying_data and 'MRData' in qualifying_data and 'RaceTable' in qualifying_data['MRData']:
                qual_races = qualifying_data['MRData']['RaceTable'].get('Races', [])
                
                if qual_races:
                    qual_results = qual_races[0].get('QualifyingResults', [])
                    
                    # Record pole position (P1 in qualifying)
                    if qual_results and int(qual_results[0].get('position', 0)) == 1:
                        pole_driver_id = qual_results[0]['Driver']['driverId']
                        
                        if pole_driver_id in year_poles:
                            year_poles[pole_driver_id] += 1
                        else:
                            year_poles[pole_driver_id] = 1
            
            # Get race results to track podiums and fastest laps
            results_data = self.ergast_api.get_race_results(str(year), str(race.round))
            
            if results_data and 'MRData' in results_data and 'RaceTable' in results_data['MRData']:
                result_races = results_data['MRData']['RaceTable'].get('Races', [])
                
                if result_races:
                    race_results = result_races[0].get('Results', [])
                    
                    # Record podiums (positions 1-3)
                    for result in race_results:
                        position = int(result.get('position', 0))
                        
                        if 1 <= position <= 3:
                            podium_driver_id = result['Driver']['driverId']
                            
                            if podium_driver_id in year_podiums:
                                year_podiums[podium_driver_id] += 1
                            else:
                                year_podiums[podium_driver_id] = 1
                        
                        # Record fastest lap
                        if 'FastestLap' in result and result['FastestLap'].get('rank', '0') == '1':
                            fastest_lap_driver_id = result['Driver']['driverId']
                            
                            if fastest_lap_driver_id in year_fastest_laps:
                                year_fastest_laps[fastest_lap_driver_id] += 1
                            else:
                                year_fastest_laps[fastest_lap_driver_id] = 1
        
        # Update driver statistics with the year's data
        for driver_id, podium_count in year_podiums.items():
            driver = self._get_driver(driver_id)
            if driver:
                driver.podiums = (driver.podiums or 0) + podium_count
                db.session.commit()
        
        for driver_id, pole_count in year_poles.items():
            driver = self._get_driver(driver_id)
            if driver:
                driver.pole_positions = (driver.pole_positions or 0) + pole_count
                db.session.commit()
        
        for driver_id, fastest_lap_count in year_fastest_laps.items():
            driver = self._get_driver(driver_id)
            if driver:
                driver.fastest_laps = (driver.fastest_laps or 0) + fastest_lap_count
                db.session.commit()
        
        logger.info(f"Race results for {year} populated successfully")
    
    def setup_elasticsearch_indices(self):
        """Set up Elasticsearch indices for F1 data"""
        # Team index mapping
        team_mapping = {
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "text", "analyzer": "standard", "fields": {"keyword": {"type": "keyword"}}},
                "full_name": {"type": "text", "analyzer": "standard"},
                "constructor_id": {"type": "keyword"},
                "team_principal": {"type": "text"},
                "base_location": {"type": "text"},
                "current_position": {"type": "integer"},
                "current_points": {"type": "float"},
                "championships": {"type": "integer"},
                "race_wins": {"type": "integer"},
                "podiums": {"type": "integer"},
                "first_entry_year": {"type": "integer"},
            }
        }
        
        # Driver index mapping
        driver_mapping = {
            "properties": {
                "id": {"type": "integer"},
                "first_name": {"type": "text", "analyzer": "standard", "fields": {"keyword": {"type": "keyword"}}},
                "last_name": {"type": "text", "analyzer": "standard", "fields": {"keyword": {"type": "keyword"}}},
                "full_name": {"type": "text", "analyzer": "standard"},
                "code": {"type": "keyword"},
                "number": {"type": "integer"},
                "driver_id": {"type": "keyword"},
                "nationality": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "date_of_birth": {"type": "date"},
                "current_position": {"type": "integer"},
                "current_points": {"type": "float"},
                "championships": {"type": "integer"},
                "race_wins": {"type": "integer"},
                "podiums": {"type": "integer"},
                "pole_positions": {"type": "integer"},
                "fastest_laps": {"type": "integer"},
                "first_race_year": {"type": "integer"},
                "team_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "team_id": {"type": "integer"},
            }
        }
        
        # Circuit index mapping
        circuit_mapping = {
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "text", "analyzer": "standard", "fields": {"keyword": {"type": "keyword"}}},
                "circuit_id": {"type": "keyword"},
                "location": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "country": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "latitude": {"type": "float"},
                "longitude": {"type": "float"},
                "length_km": {"type": "float"},
                "lap_record": {"type": "text"},
                "lap_record_year": {"type": "integer"},
            }
        }
        
        # Create indices
        self.es_service.create_index("teams", team_mapping)
        self.es_service.create_index("drivers", driver_mapping)
        self.es_service.create_index("circuits", circuit_mapping)
    
    def index_all_data(self):
        """Index all F1 data in Elasticsearch"""
        self.index_teams()
        self.index_drivers()
        self.index_circuits()
    
    def index_teams(self):
        """Index team data in Elasticsearch"""
        teams = Team.query.all()
        
        for team in teams:
            team_doc = {
                "id": team.id,
                "name": team.name,
                "full_name": team.full_name,
                "constructor_id": team.constructor_id,
                "team_principal": team.team_principal,
                "base_location": team.base_location,
                "current_position": team.current_position,
                "current_points": team.current_points,
                "championships": team.championships,
                "race_wins": team.race_wins,
                "podiums": team.podiums,
                "first_entry_year": team.first_entry_year,
            }
            
            self.es_service.index_document("teams", str(team.id), team_doc)
    
    def index_drivers(self):
        """Index driver data in Elasticsearch"""
        drivers = Driver.query.all()
        
        for driver in drivers:
            team_name = None
            if driver.team_id:
                team = Team.query.get(driver.team_id)
                if team:
                    team_name = team.name
            
            driver_doc = {
                "id": driver.id,
                "first_name": driver.first_name,
                "last_name": driver.last_name,
                "full_name": f"{driver.first_name} {driver.last_name}",
                "code": driver.code,
                "number": driver.number,
                "driver_id": driver.driver_id,
                "nationality": driver.nationality,
                "date_of_birth": driver.date_of_birth.isoformat() if driver.date_of_birth else None,
                "current_position": driver.current_position,
                "current_points": driver.current_points,
                "championships": driver.championships,
                "race_wins": driver.race_wins,
                "podiums": driver.podiums,
                "pole_positions": driver.pole_positions,
                "fastest_laps": driver.fastest_laps,
                "first_race_year": driver.first_race_year,
                "team_name": team_name,
                "team_id": driver.team_id,
            }
            
            self.es_service.index_document("drivers", str(driver.id), driver_doc)
    
    def index_circuits(self):
        """Index circuit data in Elasticsearch"""
        circuits = Circuit.query.all()
        
        for circuit in circuits:
            circuit_doc = {
                "id": circuit.id,
                "name": circuit.name,
                "circuit_id": circuit.circuit_id,
                "location": circuit.location,
                "country": circuit.country,
                "latitude": circuit.latitude,
                "longitude": circuit.longitude,
                "length_km": circuit.length_km,
                "lap_record": circuit.lap_record,
                "lap_record_year": circuit.lap_record_year,
            }
            
            self.es_service.index_document("circuits", str(circuit.id), circuit_doc)
    
    def _get_driver(self, driver_id):
        """Get a driver from cache or database"""
        if driver_id in self.driver_cache:
            return self.driver_cache[driver_id]
        
        driver = Driver.query.filter_by(driver_id=driver_id).first()
        if driver:
            self.driver_cache[driver_id] = driver
        
        return driver
    
    def _get_team(self, constructor_id):
        """Get a team from cache or database"""
        if constructor_id in self.team_cache:
            return self.team_cache[constructor_id]
        
        team = Team.query.filter_by(constructor_id=constructor_id).first()
        if team:
            self.team_cache[constructor_id] = team
        
        return team 