# Modern Login & Register System

A modern authentication system with a beautiful UI, featuring login, registration, and Two-Factor Authentication (2FA).

## Features

- User registration with validation
- User login with JWT authentication
- Two-Factor Authentication (2FA)
  - TOTP-based authentication (compatible with Google Authenticator, Authy, etc.)
  - QR code setup for easy configuration
  - Backup codes for account recovery
  - Rate limiting and temporary lockout for security
- Social Authentication
  - Google OAuth2
  - GitHub OAuth
  - Facebook OAuth
- Email verification
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
│   │   ├── routes.py     # API routes
│   │   ├── verify_routes.py  # Email verification routes
│   │   └── email_utils.py    # Email utilities
│   ├── migrations/       # Database migrations
│   ├── requirements.txt  # Python dependencies
│   └── run.py           # Entry point
└── README.md            # Project documentation
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
flask db upgrade  # Apply database migrations
python run.py
```

4. Configure environment variables:

Create a `.env` file in the backend directory with the following variables:

```env
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
DATABASE_URI=sqlite:///dev.db  # or your database URI

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_DEFAULT_SENDER=your_email@gmail.com

# OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
```

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login with email and password
- `POST /api/auth/logout`: Logout and invalidate token

### Two-Factor Authentication (2FA)

- `POST /api/auth/2fa/setup`: Initialize 2FA setup
- `POST /api/auth/2fa/verify-setup`: Complete 2FA setup
- `POST /api/auth/2fa/verify`: Verify 2FA token during login
- `POST /api/auth/2fa/backup-code`: Use backup code for 2FA
- `POST /api/auth/2fa/disable`: Disable 2FA

### Social Authentication

- `GET /api/auth/login/github`: Initiate GitHub OAuth login
- `GET /api/auth/login/google`: Initiate Google OAuth login
- `GET /api/auth/login/facebook`: Initiate Facebook OAuth login

### Email Verification

- `GET /api/verify/email/<token>`: Verify email address
- `POST /api/verify/resend`: Resend verification email

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Two-Factor Authentication (2FA)
  - TOTP-based authentication
  - Rate limiting (5 attempts)
  - 15-minute lockout after failed attempts
  - Secure backup codes
- Email verification
- CORS protection
- Environment variable configuration
- SQL injection protection through SQLAlchemy

## Technologies Used

- **Frontend**: React, Tailwind CSS, Axios
- **Backend**: Flask, SQLAlchemy, JWT
- **Database**: SQLite (development), can be configured for PostgreSQL, MySQL, etc.
- **Authentication**: JWT, OAuth2, TOTP (2FA)
- **Security**: bcrypt, rate limiting
- **Email**: Flask-Mail
- **Other**: Flask-Migrate, pyotp, qrcode

## License

This project is open source and available under the MIT License.