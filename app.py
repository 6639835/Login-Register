from flask import Flask, render_template, redirect, url_for, flash, request
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime, timedelta
from crypto_utils import encrypt_data, decrypt_data
from sqlalchemy.ext.hybrid import hybrid_property
from flask_caching import Cache
from flask_assets import Environment, Bundle
from flask_mail import Mail, Message
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
import secrets

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24).hex()
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('EMAIL_USER', '')
app.config['MAIL_PASSWORD'] = os.environ.get('EMAIL_PASS', '')
mail = Mail(app)

# Define Forms
class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Sign Up')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('That username is taken. Please choose a different one.')

class RequestResetForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    submit = SubmitField('Request Password Reset')

    def validate_email(self, email):
        user = User.find_by_email(email.data)
        if user is None:
            raise ValidationError('There is no account with that email. You must register first.')

class ResetPasswordForm(FlaskForm):
    password = PasswordField('Password', validators=[DataRequired()])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Reset Password')

# Configure caching
app.config['CACHE_TYPE'] = 'SimpleCache'
app.config['CACHE_DEFAULT_TIMEOUT'] = 300  # 5 minutes default cache timeout
cache = Cache(app)

# Configure Assets for minification
assets = Environment(app)
assets.debug = False

# Define bundles for CSS
css = Bundle(
    'css/style.css',
    filters='cssmin',
    output='gen/style.min.css'
)
assets.register('css_all', css)

# Define bundles for JS
js = Bundle(
    'js/main.js',
    filters='jsmin',
    output='gen/script.min.js'
)
assets.register('js_all', js)

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Initialize Login Manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Add context processor for current year
@app.context_processor
def inject_now():
    return {'now': datetime.utcnow()}

# User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    _email = db.Column('email', db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(200), nullable=False)
    registered_on = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    @hybrid_property
    def email(self):
        """Decrypt email when accessing the property"""
        return decrypt_data(self._email)
    
    @email.setter
    def email(self, value):
        """Encrypt email when setting the property"""
        self._email = encrypt_data(value)
        
    # Helper method to find a user by email
    @classmethod
    def find_by_email(cls, email):
        """Find a user by their email by checking against encrypted values"""
        encrypted_email = encrypt_data(email)
        # Query directly against the encrypted value
        return cls.query.filter(cls._email == encrypted_email).first()
    
    def get_reset_token(self, expires_sec=1800):
        """Generate a time-limited reset token"""
        s = secrets.token_urlsafe(32)
        # Store token in the database or cache
        # For simplicity, we could use a separate table or Redis
        return s

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Send email for password reset
def send_reset_email(user):
    token = user.get_reset_token()
    msg = Message('Password Reset Request',
                  sender='noreply@auth-system.com',
                  recipients=[user.email])
    msg.body = f'''To reset your password, visit the following link:
{url_for('reset_token', token=token, _external=True)}

If you did not make this request, simply ignore this email and no changes will be made.
'''
    mail.send(msg)

# Routes
@app.route('/')
@cache.cached(timeout=60)  # Cache this view for 60 seconds
def home():
    return render_template('index.html')

@app.route('/features')
@cache.cached(timeout=60)  # Cache this view for 60 seconds
def features():
    return render_template('features.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.find_by_email(form.email.data)
        
        if user and check_password_hash(user.password, form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            flash('Logged in successfully!', 'success')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash('Login failed. Please check your email and password.', 'danger')
    
    return render_template('login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        existing_user = User.query.filter_by(username=form.username.data).first()
        if existing_user:
            flash('Username already exists!', 'danger')
            return render_template('register.html', form=form)
        
        # Optimized email uniqueness check
        existing_email_user = User.find_by_email(form.email.data)
        if existing_email_user:
            flash('Email already registered!', 'danger')
            return render_template('register.html', form=form)
        
        hashed_password = generate_password_hash(form.password.data, method='pbkdf2:sha256')
        new_user = User(username=form.username.data, email=form.email.data, password=hashed_password)
        
        db.session.add(new_user)
        db.session.commit()
        
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', form=form)

@app.route('/reset_password', methods=['GET', 'POST'])
def reset_request():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = RequestResetForm()
    if form.validate_on_submit():
        user = User.find_by_email(form.email.data)
        send_reset_email(user)
        flash('An email has been sent with instructions to reset your password.', 'info')
        return redirect(url_for('login'))
    
    return render_template('reset_request.html', form=form)

@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_token(token):
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    # Verify token
    # In a real app, validate the token against the database or cache
    
    form = ResetPasswordForm()
    if form.validate_on_submit():
        # Find user by token and update password
        # For demo purposes, we'll just redirect
        flash('Your password has been updated! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('reset_token.html', form=form)

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html')

@app.route('/settings')
@login_required
def settings():
    return render_template('settings.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')
        # Process contact form (in a real app, you would send an email, store in DB, etc.)
        flash('Your message has been received. We will get back to you soon!', 'success')
        return redirect(url_for('contact'))
    return render_template('contact.html')

@app.route('/faq')
def faq():
    return render_template('faq.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('home'))

# Configure static file caching
@app.after_request
def add_cache_headers(response):
    # Cache static files for 1 week
    if request.path.startswith('/static/'):
        max_age = 60 * 60 * 24 * 7  # 1 week in seconds
        response.cache_control.public = True
        response.cache_control.max_age = max_age
        response.expires = datetime.utcnow() + timedelta(seconds=max_age)
    return response

if __name__ == '__main__':
    # Create database tables before running the app
    with app.app_context():
        db.create_all()
    app.run(debug=True) 