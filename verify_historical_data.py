#!/usr/bin/env python3
"""
Script to verify the historical F1 data in the database.
"""

from app import create_app, db
from app.models import Driver, Team, Circuit, Race
from datetime import datetime

def main():
    """Main function to verify the historical F1 data."""
    app = create_app()
    
    with app.app_context():
        print("=== F1 Historical Data Verification ===\n")
        
        # Get database statistics
        team_count = Team.query.count()
        driver_count = Driver.query.count()
        circuit_count = Circuit.query.count()
        race_count = Race.query.count()
        
        # Get years range
        seasons = db.session.query(db.func.distinct(Race.season)).order_by(Race.season).all()
        seasons = [season[0] for season in seasons]
        years_range = f"{min(seasons)}-{max(seasons)}" if seasons else "None"
        
        print(f"Total Teams: {team_count}")
        print(f"Total Drivers: {driver_count}")
        print(f"Total Circuits: {circuit_count}")
        print(f"Total Races: {race_count}")
        print(f"Years Coverage: {years_range}")
        print()
        
        # Show team statistics
        print("=== Team Championships ===")
        top_teams = Team.query.order_by(Team.championships.desc()).limit(10).all()
        for team in top_teams:
            print(f"{team.name}: {team.championships} championships")
        print()
        
        # Show driver championships
        print("=== Driver Championships ===")
        top_drivers = Driver.query.order_by(Driver.championships.desc()).limit(10).all()
        for driver in top_drivers:
            print(f"{driver.first_name} {driver.last_name}: {driver.championships} championships")
        print()
        
        # Show race wins
        print("=== Most Race Wins (Drivers) ===")
        win_drivers = Driver.query.order_by(Driver.race_wins.desc()).limit(10).all()
        for driver in win_drivers:
            print(f"{driver.first_name} {driver.last_name}: {driver.race_wins} wins")
        print()
        
        # Show pole positions
        print("=== Most Pole Positions ===")
        pole_drivers = Driver.query.order_by(Driver.pole_positions.desc()).limit(10).all()
        for driver in pole_drivers:
            print(f"{driver.first_name} {driver.last_name}: {driver.pole_positions} poles")
        print()
        
        # Show podiums
        print("=== Most Podiums ===")
        podium_drivers = Driver.query.order_by(Driver.podiums.desc()).limit(10).all()
        for driver in podium_drivers:
            print(f"{driver.first_name} {driver.last_name}: {driver.podiums} podiums")
        print()
        
        # Show fastest laps
        print("=== Most Fastest Laps ===")
        fastest_lap_drivers = Driver.query.order_by(Driver.fastest_laps.desc()).limit(10).all()
        for driver in fastest_lap_drivers:
            print(f"{driver.first_name} {driver.last_name}: {driver.fastest_laps} fastest laps")
        print()
        
        # Show current standings
        print("=== Current Driver Standings (2024) ===")
        current_drivers = Driver.query.filter(Driver.current_position.isnot(None)).order_by(Driver.current_position).limit(10).all()
        for driver in current_drivers:
            team_name = driver.team.name if driver.team else "No team"
            print(f"{driver.current_position}. {driver.first_name} {driver.last_name} ({driver.code}) - {driver.current_points} points - {team_name}")
        print()
        
        # Show team standings
        print("=== Current Team Standings (2024) ===")
        current_teams = Team.query.filter(Team.current_position.isnot(None)).order_by(Team.current_position).limit(10).all()
        for team in current_teams:
            print(f"{team.current_position}. {team.name} - {team.current_points} points")
        print()
        
        # Show upcoming races
        print("=== Upcoming Races (2024) ===")
        upcoming_races = Race.query.filter_by(status='upcoming').order_by(Race.round).limit(5).all()
        for race in upcoming_races:
            circuit = Circuit.query.get(race.circuit_id)
            location = f"{circuit.location}, {circuit.country}" if circuit else "Unknown location"
            print(f"Round {race.round}: {race.name} - {race.race_date.strftime('%Y-%m-%d') if race.race_date else 'TBD'} - {location}")
        
if __name__ == '__main__':
    main() 