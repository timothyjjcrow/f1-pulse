#!/usr/bin/env python3
"""
Script to verify data in the F1 Pulse database.
"""

from app import create_app, db
from app.models import Team, Driver, Circuit, Race
from datetime import datetime

def main():
    app = create_app()
    with app.app_context():
        # Get the current season
        races = Race.query.all()
        current_season = races[0].season if races else "Unknown"
        
        # Count records
        print(f'F1 {current_season} Season Data:')
        print(f'Teams: {Team.query.count()}')
        print(f'Drivers: {Driver.query.count()}')
        print(f'Circuits: {Circuit.query.count()}')
        print(f'Races: {Race.query.count()}')
        
        # Top 5 Drivers
        print(f'\nTop 5 Drivers ({current_season}):')
        for driver in Driver.query.order_by(Driver.current_position).limit(5).all():
            team_name = driver.team.name if driver.team else "No team"
            print(f'{driver.current_position}. {driver.first_name} {driver.last_name} ({driver.code}) - {driver.current_points} points - {team_name}')
        
        # Next upcoming races
        print(f'\nUpcoming Races ({current_season}):')
        upcoming_races = Race.query.filter_by(status='upcoming').order_by(Race.round).limit(5).all()
        if upcoming_races:
            for race in upcoming_races:
                circuit = Circuit.query.get(race.circuit_id)
                location = f"{circuit.location}, {circuit.country}" if circuit else "Unknown location"
                print(f'Round {race.round}: {race.name} - {race.race_date.strftime("%Y-%m-%d") if race.race_date else "TBD"} - {location}')
        else:
            print("No upcoming races found")
            
            # If no upcoming races, show the most recent completed races
            print(f'\nMost Recent Races ({current_season}):')
            for race in Race.query.filter_by(status='completed').order_by(Race.round.desc()).limit(3).all():
                circuit = Circuit.query.get(race.circuit_id)
                location = f"{circuit.location}, {circuit.country}" if circuit else "Unknown location"
                print(f'Round {race.round}: {race.name} - {race.race_date.strftime("%Y-%m-%d") if race.race_date else "Unknown date"} - {location}')
        
        # Teams Standings
        print(f'\nTeam Standings ({current_season}):')
        for team in Team.query.order_by(Team.current_position).all():
            print(f'{team.current_position}. {team.name} - {team.current_points} points')

if __name__ == '__main__':
    main() 