from flask import Blueprint, render_template, request, jsonify, current_app
from app.services.ergast_api import ErgastAPI

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Render the home page"""
    return render_template('index.html')

@main_bp.route('/drivers')
def drivers():
    """Render the drivers page"""
    return render_template('drivers.html')

@main_bp.route('/teams')
def teams():
    """Render the teams page"""
    return render_template('teams.html')

@main_bp.route('/races')
def races():
    """Render the races page"""
    return render_template('races.html')

@main_bp.route('/race/<int:season>/<int:round_num>')
def race_detail(season, round_num):
    """Render the race detail page"""
    return render_template('race_detail.html', season=season, round_num=round_num)

@main_bp.route('/driver/<driver_id>')
def driver_detail(driver_id):
    """Render the driver detail page"""
    return render_template('driver_detail.html', driver_id=driver_id)

@main_bp.route('/team/<constructor_id>')
def team_detail(constructor_id):
    """Render the team detail page"""
    return render_template('team_detail.html', constructor_id=constructor_id)

@main_bp.route('/circuit/<circuit_id>')
def circuit_detail(circuit_id):
    """Render the circuit detail page"""
    return render_template('circuit_detail.html', circuit_id=circuit_id)

@main_bp.route('/standings')
def standings():
    """Render the standings page"""
    return render_template('standings.html')

@main_bp.route('/pit-stop-challenge')
def pit_stop_challenge():
    """Render the Virtual Pit Stop Challenge page"""
    return render_template('pit_stop_challenge.html')

@main_bp.route('/about')
def about():
    """Render the about page"""
    return render_template('about.html')

@main_bp.route('/search')
def search():
    """Render the search results page"""
    query = request.args.get('q', '')
    return render_template('search.html', query=query) 