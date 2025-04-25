from app import app, User, db
from crypto_utils import encrypt_data

def migrate_user_emails():
    """
    Migration script to encrypt existing user emails.
    Run this script after updating the User model but before using the application.
    """
    print("Starting migration of user email data...")
    
    with app.app_context():
        # Get all users
        users = User.query.all()
        count = 0
        
        for user in users:
            try:
                # Check if email is not encrypted yet (will not have base64 padding)
                if not user._email.endswith('='):
                    print(f"Encrypting email for user: {user.username}")
                    # Store the plain email temporarily
                    plain_email = user._email
                    # Encrypt the email and store it back
                    user._email = encrypt_data(plain_email)
                    count += 1
            except Exception as e:
                print(f"Error processing user {user.username}: {e}")
                continue
        
        # Commit all changes
        if count > 0:
            db.session.commit()
            print(f"Successfully encrypted {count} user email(s)")
        else:
            print("No emails needed encryption")

if __name__ == "__main__":
    migrate_user_emails() 