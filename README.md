# Login-Register System

A simple user authentication system built with Flask that allows users to register, login, and access a personalized dashboard.

## Features

- User registration with unique username and email validation
- Secure password storage using hashing
- User login with session management
- Protected dashboard for authenticated users
- Responsive design for all devices

## Installation

1. Clone the repository:
```
git clone <repository-url>
cd Login-Register
```

2. Create and activate a virtual environment:
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```
pip install -r requirements.txt
```

## Usage

1. Run the application:
```
python app.py
```

2. Open your web browser and navigate to:
```
http://127.0.0.1:5000/
```

## Project Structure

- `app.py`: Main Flask application
- `static/`: Static files (CSS, JavaScript)
- `templates/`: HTML templates
- `instance/`: Database file location

## Database

The application uses SQLite as the database. The database file will be created automatically in the `instance` directory when you first run the application.

## Development

To run the application in development mode with debug enabled:

```
flask run --debug
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 