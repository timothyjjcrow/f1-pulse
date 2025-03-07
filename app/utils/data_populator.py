import logging
from app import db
from app.models import Driver, Team, Circuit, Race
from app.services.ergast_api import ErgastAPI
from app.services.elasticsearch_service import ElasticsearchService
from datetime import datetime

logger = logging.getLogger(__name__)

class DataPopulator:
    """Utility for populating the database with data from the Ergast API"""
    
    def __init__(self, app):
        self.app = app
        self.ergast_api = ErgastAPI()
        self.es_service = ElasticsearchService()
        self.es_service.initialize(app)
    
    def populate_all(self, force_update=False):
        """Populate all data from the API"""
        with self.app.app_context():
            self.populate_teams(force_update)
            self.populate_drivers(force_update)
            self.populate_circuits(force_update)
            self.populate_races(force_update)
            self.setup_elasticsearch_indices()
            self.index_all_data()
    
    def populate_teams(self, force_update=False):
        """Populate team/constructor data"""
        logger.info("Populating teams data...")
        
        # Get constructor standings to get current teams
        data = self.ergast_api.get_constructors_standings('2024')
        
        if not data or 'MRData' not in data:
            logger.error("Failed to retrieve constructor standings")
            return
        
        standings_list = data['MRData']['StandingsTable']['StandingsLists']
        
        if not standings_list:
            logger.error("No constructor standings data available")
            return
        
        constructor_standings = standings_list[0]['ConstructorStandings']
        
        for standing in constructor_standings:
            constructor = standing['Constructor']
            
            # Check if team already exists
            team = Team.query.filter_by(constructor_id=constructor['constructorId']).first()
            
            if team and not force_update:
                logger.info(f"Team {constructor['name']} already exists, skipping...")
                continue
            
            # Create new team or update existing
            if not team:
                team = Team(
                    name=constructor['name'],
                    full_name=constructor.get('name', constructor['name']),
                    constructor_id=constructor['constructorId'],
                )
                logger.info(f"Creating team {team.name}")
                db.session.add(team)
            else:
                logger.info(f"Updating team {team.name}")
            
            # Update team data
            team.current_position = int(standing['position'])
            team.current_points = float(standing['points'])
            
            # Save to database
            db.session.commit()
        
        logger.info(f"Teams data population completed")
    
    def populate_drivers(self, force_update=False):
        """Populate driver data"""
        logger.info("Populating drivers data...")
        
        # Get driver standings to get current drivers
        data = self.ergast_api.get_drivers_standings('2024')
        
        if not data or 'MRData' not in data:
            logger.error("Failed to retrieve driver standings")
            return
        
        standings_list = data['MRData']['StandingsTable']['StandingsLists']
        
        if not standings_list:
            logger.error("No driver standings data available")
            return
        
        driver_standings = standings_list[0]['DriverStandings']
        
        for standing in driver_standings:
            driver_data = standing['Driver']
            constructor = standing['Constructors'][0]
            
            # Check if driver already exists
            driver = Driver.query.filter_by(driver_id=driver_data['driverId']).first()
            
            if driver and not force_update:
                logger.info(f"Driver {driver_data['givenName']} {driver_data['familyName']} already exists, skipping...")
                continue
            
            # Get team
            team = Team.query.filter_by(constructor_id=constructor['constructorId']).first()
            
            # Create or update driver
            if not driver:
                driver = Driver(
                    first_name=driver_data['givenName'],
                    last_name=driver_data['familyName'],
                    code=driver_data.get('code', ''),
                    number=driver_data.get('permanentNumber', None),
                    driver_id=driver_data['driverId'],
                    nationality=driver_data.get('nationality', ''),
                    date_of_birth=datetime.strptime(driver_data.get('dateOfBirth', '1900-01-01'), '%Y-%m-%d').date() if 'dateOfBirth' in driver_data else None,
                    team_id=team.id if team else None
                )
                logger.info(f"Creating driver {driver.first_name} {driver.last_name}")
                db.session.add(driver)
            else:
                logger.info(f"Updating driver {driver.first_name} {driver.last_name}")
                if team:
                    driver.team_id = team.id
            
            # Update driver standings
            driver.current_position = int(standing['position'])
            driver.current_points = float(standing['points'])
            
            # Save to database
            db.session.commit()
        
        logger.info(f"Drivers data population completed")
    
    def populate_circuits(self, force_update=False):
        """Populate circuit data"""
        logger.info("Populating circuits data...")
        
        # Get current season races to get circuit information
        data = self.ergast_api.get_season_races('2024')
        
        if not data or 'MRData' not in data:
            logger.error("Failed to retrieve season races")
            return
        
        races = data['MRData']['RaceTable']['Races']
        
        for race in races:
            circuit_data = race['Circuit']
            
            # Check if circuit already exists
            circuit = Circuit.query.filter_by(circuit_id=circuit_data['circuitId']).first()
            
            if circuit and not force_update:
                logger.info(f"Circuit {circuit_data['circuitName']} already exists, skipping...")
                continue
            
            # Create or update circuit
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
            else:
                logger.info(f"Updating circuit {circuit.name}")
                circuit.location = circuit_data['Location'].get('locality', '')
                circuit.country = circuit_data['Location'].get('country', '')
                circuit.latitude = float(circuit_data['Location'].get('lat', 0))
                circuit.longitude = float(circuit_data['Location'].get('long', 0))
            
            # Save to database
            db.session.commit()
        
        logger.info(f"Circuits data population completed")
    
    def populate_races(self, force_update=False):
        """Populate race data"""
        logger.info("Populating races data...")
        
        # Get current season races
        data = self.ergast_api.get_season_races('2024')
        
        if not data or 'MRData' not in data:
            logger.error("Failed to retrieve season races")
            return
        
        races_data = data['MRData']['RaceTable']['Races']
        
        for race_data in races_data:
            # Check if race already exists
            race_id = f"{race_data['season']}-{race_data['round']}"
            race = Race.query.filter_by(race_id=race_id).first()
            
            if race and not force_update:
                logger.info(f"Race {race_data['raceName']} already exists, skipping...")
                continue
            
            # Get circuit
            circuit = Circuit.query.filter_by(circuit_id=race_data['Circuit']['circuitId']).first()
            
            if not circuit:
                logger.warning(f"Circuit {race_data['Circuit']['circuitName']} not found, skipping race...")
                continue
            
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
                logger.error(f"Error parsing dates for race {race_data['raceName']}: {str(e)}")
                continue
            
            # Calculate race status
            current_time = datetime.utcnow()
            
            # For 2024 season races, set past races as completed
            if race_date and race_date < current_time:
                status = 'completed'
            elif (qualifying_date and qualifying_date < current_time) or \
                 (sprint_date and sprint_date < current_time) or \
                 (fp1_date and fp1_date < current_time) or \
                 (fp2_date and fp2_date < current_time) or \
                 (fp3_date and fp3_date < current_time):
                status = 'in_progress'
            else:
                status = 'upcoming'
                
            # Double-check status based on round for 2024 season
            # Current date is in March 2024, so races with round <= 4 are likely completed
            # Adjust as needed based on the current date
            if int(race_data['season']) == 2024:
                if int(race_data['round']) <= 18:  # Adjust this number based on the current date
                    status = 'completed'
                elif int(race_data['round']) == 19:  # Current or next race
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
                logger.info(f"Creating race {race.name} (Round {race.round})")
                db.session.add(race)
            else:
                logger.info(f"Updating race {race.name} (Round {race.round})")
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
        
        logger.info(f"Races data population completed")
    
    def setup_elasticsearch_indices(self):
        """Set up Elasticsearch indices for drivers, teams, and circuits"""
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
        self.es_service.create_index("drivers", driver_mapping)
        self.es_service.create_index("teams", team_mapping)
        self.es_service.create_index("circuits", circuit_mapping)
    
    def index_all_data(self):
        """Index all data to Elasticsearch"""
        self.index_drivers()
        self.index_teams()
        self.index_circuits()
    
    def index_drivers(self):
        """Index drivers to Elasticsearch"""
        logger.info("Indexing drivers to Elasticsearch...")
        
        drivers = Driver.query.all()
        
        for driver in drivers:
            # Get team name
            team_name = ""
            if driver.team_id:
                team = Team.query.get(driver.team_id)
                if team:
                    team_name = team.name
            
            # Prepare document
            doc = {
                "id": driver.id,
                "driver_id": driver.driver_id,
                "first_name": driver.first_name,
                "last_name": driver.last_name,
                "full_name": f"{driver.first_name} {driver.last_name}",
                "code": driver.code,
                "number": driver.number,
                "nationality": driver.nationality,
                "current_position": driver.current_position,
                "current_points": driver.current_points,
                "team_name": team_name
            }
            
            # Index document
            self.es_service.index_document("drivers", driver.id, doc)
        
        logger.info(f"Indexed {len(drivers)} drivers to Elasticsearch")
    
    def index_teams(self):
        """Index teams to Elasticsearch"""
        logger.info("Indexing teams to Elasticsearch...")
        
        teams = Team.query.all()
        
        for team in teams:
            # Prepare document
            doc = {
                "id": team.id,
                "constructor_id": team.constructor_id,
                "name": team.name,
                "full_name": team.full_name,
                "team_principal": team.team_principal,
                "base_location": team.base_location,
                "current_position": team.current_position,
                "current_points": team.current_points
            }
            
            # Index document
            self.es_service.index_document("teams", team.id, doc)
        
        logger.info(f"Indexed {len(teams)} teams to Elasticsearch")
    
    def index_circuits(self):
        """Index circuits to Elasticsearch"""
        logger.info("Indexing circuits to Elasticsearch...")
        
        circuits = Circuit.query.all()
        
        for circuit in circuits:
            # Prepare document
            doc = {
                "id": circuit.id,
                "circuit_id": circuit.circuit_id,
                "name": circuit.name,
                "location": circuit.location,
                "country": circuit.country,
                "coordinates": {
                    "lat": circuit.latitude,
                    "lon": circuit.longitude
                }
            }
            
            # Index document
            self.es_service.index_document("circuits", circuit.id, doc)
        
        logger.info(f"Indexed {len(circuits)} circuits to Elasticsearch") 