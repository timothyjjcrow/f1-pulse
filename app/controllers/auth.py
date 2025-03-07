from flask import Blueprint, render_template, redirect, url_for, flash, request, session, current_app
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models.user import User
from werkzeug.security import generate_password_hash
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import uuid

auth_bp = Blueprint('auth', __name__)

# Helper function to check if file has allowed extension
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper function to generate a unique filename
def get_unique_filename(filename):
    # Get file extension
    ext = filename.rsplit('.', 1)[1].lower()
    # Generate unique name with uuid
    return f"{uuid.uuid4().hex}.{ext}"

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login"""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(username=username).first()
        
        # Check if user exists and password is correct
        if not user or not user.check_password(password):
            flash('Please check your login details and try again.', 'danger')
            return redirect(url_for('auth.login'))
        
        # If the above check passes, the user has the right credentials
        login_user(user, remember=remember)
        user.last_login_at = datetime.utcnow()
        db.session.commit()
        
        # Redirect to the page the user was trying to access
        next_page = request.args.get('next')
        if not next_page or not next_page.startswith('/'):
            next_page = url_for('main.index')
        
        flash('Logged in successfully!', 'success')
        return redirect(next_page)
    
    return render_template('auth/login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Handle user registration"""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Check if passwords match
        if password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return redirect(url_for('auth.register'))
        
        # Check if username already exists
        user = User.query.filter_by(username=username).first()
        if user:
            flash('Username already exists.', 'danger')
            return redirect(url_for('auth.register'))
        
        # Check if email already exists
        user = User.query.filter_by(email=email).first()
        if user:
            flash('Email already exists.', 'danger')
            return redirect(url_for('auth.register'))
        
        # Create new user
        new_user = User(
            username=username,
            email=email
        )
        new_user.set_password(password)
        
        # Add the new user to the database
        db.session.add(new_user)
        db.session.commit()
        
        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/register.html')

@auth_bp.route('/logout')
@login_required
def logout():
    """Handle user logout"""
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('main.index'))

@auth_bp.route('/profile')
@login_required
def profile():
    """Display user profile"""
    return render_template('auth/profile.html')

@auth_bp.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    """Edit user profile"""
    if request.method == 'POST':
        # Update user information
        current_user.first_name = request.form.get('first_name')
        current_user.last_name = request.form.get('last_name')
        
        # Update favorite driver and team
        favorite_driver_id = request.form.get('favorite_driver')
        # Set to None if empty string (user cleared selection)
        current_user.favorite_driver_id = favorite_driver_id if favorite_driver_id else None
        
        favorite_team_id = request.form.get('favorite_team')
        # Set to None if empty string (user cleared selection)
        current_user.favorite_team_id = favorite_team_id if favorite_team_id else None
        
        # Handle avatar upload
        if 'avatar' in request.files:
            avatar_file = request.files['avatar']
            if avatar_file and avatar_file.filename:
                if allowed_file(avatar_file.filename):
                    # Create avatars directory if it doesn't exist
                    avatar_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'avatars')
                    os.makedirs(avatar_dir, exist_ok=True)
                    
                    # Generate a secure, unique filename
                    filename = get_unique_filename(secure_filename(avatar_file.filename))
                    filepath = os.path.join(avatar_dir, filename)
                    
                    # Save the file
                    avatar_file.save(filepath)
                    
                    # Update user avatar URL (store relative path)
                    current_user.avatar_url = url_for('static', filename=f'uploads/avatars/{filename}')
                else:
                    flash('Invalid file format. Please upload PNG, JPG, JPEG, or GIF files.', 'danger')
        
        # Save changes
        db.session.commit()
        
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('auth.profile'))
    
    return render_template('auth/edit_profile.html') 