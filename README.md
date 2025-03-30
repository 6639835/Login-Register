# SecureAuth - Authentication System

A comprehensive authentication system with modern security features including OAuth social login, two-factor authentication, and email verification.

## Features

- User registration and login
- Email verification
- Two-factor authentication (TOTP) with backup codes
- Social authentication (GitHub, Google, Facebook)
- JWT-based authentication
- Rate limiting on sensitive endpoints
- Account management (profile update, password change)
- Modern, responsive UI with Tailwind CSS

## Tech Stack

### Backend
- Flask (Python web framework)
- SQLAlchemy (ORM)
- Flask-JWT-Extended (JWT authentication)
- Flask-Mail (email services)
- Flask-Bcrypt (password hashing)
- Authlib (OAuth implementation)
- PyOTP (TOTP implementation)

### Frontend
- React
- React Router
- Tailwind CSS
- Vite (build tool)

## Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn

### Using Docker (Recommended)

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/secure-auth.git
   cd secure-auth
   ```

2. Copy example env files and configure:
   ```
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   
3. Edit the .env files with your configuration

4. Build and run with docker-compose:
   ```
   docker-compose up -d
   ```

5. Access the application at http://localhost

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Copy environment template and configure:
   ```
   cp .env.example .env
   ```
   
5. Edit .env with your configuration (database, email, OAuth credentials)

6. Run the application:
   ```
   flask run
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy environment template and configure:
   ```
   cp .env.example .env
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Access the application at http://localhost:3000

## Configuration

### Backend Configuration (.env)

- `SECRET_KEY` - Flask application secret key
- `JWT_SECRET_KEY` - Secret key for JWT token generation
- `DATA_ENCRYPTION_KEY` - Key for encrypting sensitive data
- `ENCRYPTION_SALT` - Salt for key derivation (if not using direct encryption key)
- `DATABASE_URI` - SQLAlchemy database connection string
- `MAIL_*` - Email configuration for sending verification emails
- `*_CLIENT_ID` and `*_CLIENT_SECRET` - OAuth provider credentials

### Frontend Configuration (.env)

- `VITE_API_URL` - Backend API URL
- `VITE_TOKEN_EXPIRY_DAYS` - JWT token expiry in days

## Security Considerations

- Use HTTPS in production
- Regularly rotate encryption keys
- Store sensitive keys in a secure vault in production
- Follow OAuth provider best practices
- Consider implementing HTTP-only cookies for token storage
- Implement proper database backups

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.