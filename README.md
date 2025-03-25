# Modern Login & Register System

A modern authentication system with a beautiful UI, featuring login and registration functionality.

## Features

- User registration with validation
- User login with JWT authentication
- Modern, responsive UI built with React and Tailwind CSS
- Flask backend with SQLAlchemy for database management
- Secure password hashing using bcrypt

## Project Structure

```
├── frontend/             # React frontend
│   ├── src/              # Source code
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── App.jsx       # Main application component
│   │   └── main.jsx      # Entry point
│   ├── public/           # Static assets
│   └── package.json      # Dependencies and scripts
├── backend/              # Flask backend
│   ├── app/              # Application package
│   │   ├── __init__.py   # App initialization
│   │   ├── models.py     # Database models
│   │   └── routes.py     # API routes
│   ├── requirements.txt  # Python dependencies
│   └── run.py            # Entry point
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.8+
- pip

### Installation

1. Clone the repository
2. Set up the frontend:

```bash
cd frontend
npm install
npm start
```

3. Set up the backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

## Usage

1. Register a new account on the registration page
2. Log in with your credentials
3. Access the protected dashboard

## Screenshot

(Place screenshot here)

## Technologies Used

- **Frontend**: React, Tailwind CSS, Axios
- **Backend**: Flask, SQLAlchemy, JWT
- **Database**: SQLite (development), can be configured for PostgreSQL, MySQL, etc.

## License

This project is open source and available under the MIT License.