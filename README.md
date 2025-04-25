# Secure Login-Register System

A Flask-based authentication system with enhanced security features including encrypted user data storage.

## Features

- Secure login and registration system
- Modern, responsive UI with animations
- Password hashing using PBKDF2 with SHA-256
- Email encryption using Fernet symmetric encryption
- Environment variable support for secure key management

## Installation

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run the application: `python app.py`

## Security Features

### Password Security

Passwords are never stored in plain text. The system uses Werkzeug's `generate_password_hash` function with PBKDF2 and SHA-256 for secure password storage.

### Data Encryption

Sensitive user data such as email addresses are encrypted using Fernet symmetric encryption from the Python cryptography library.

### Setting Up Encryption for Production

When using this system in production, follow these steps to secure the encryption key:

1. The first time you run the application, it will generate an encryption key file (`encryption_key.key`).
2. For production environments, set this key as an environment variable:
   ```
   export USER_DATA_ENCRYPTION_KEY="your-key-from-key-file"
   ```
   Note: The key in the file is in binary format, but needs to be base64-encoded when used as an environment variable.

3. Make sure to add the key file to `.gitignore` to avoid committing it to version control.

4. For migrating an existing database to use encryption, run:
   ```
   python migrate_data.py
   ```

### Security Best Practices

- Use HTTPS in production
- Regularly rotate encryption keys
- Set up proper access controls for the database
- Consider adding two-factor authentication
- Keep all dependencies updated

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