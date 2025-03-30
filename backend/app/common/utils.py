import os
import base64
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)

# Get encryption key from environment or generate one
def get_encryption_key():
    """
    Get encryption key from environment variable or derive one using PBKDF2.
    For production, an externally managed secure key should be used.
    """
    key = os.environ.get('DATA_ENCRYPTION_KEY')
    if not key:
        # Use a more secure approach for key derivation
        logger.warning("DATA_ENCRYPTION_KEY not set. Using derived key (not recommended for production).")
        
        # For production, use an externally managed secure key
        secret = os.environ.get('SECRET_KEY', 'fallback_secret_key')
        
        # Use a different salt for each deployment
        salt_str = os.environ.get('ENCRYPTION_SALT')
        if not salt_str:
            # If no salt is provided, create one - but this should be stored
            # across application restarts in a production environment
            salt = os.urandom(16)
            logger.warning("ENCRYPTION_SALT not set. Generated random salt.")
        else:
            # Convert hex string to bytes
            try:
                salt = bytes.fromhex(salt_str)
            except ValueError:
                logger.error("Invalid ENCRYPTION_SALT format. Must be hex string.")
                salt = os.urandom(16)
        
        # Use a stronger KDF with more iterations
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,  # OWASP recommended minimum iterations
        )
        key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
    return key

# Initialize Fernet cipher
CIPHER = Fernet(get_encryption_key())

def encrypt_data(data):
    """Encrypt data using Fernet symmetric encryption."""
    if data is None:
        return None
    return CIPHER.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data):
    """Decrypt data that was encrypted with Fernet."""
    if encrypted_data is None:
        return None
    return CIPHER.decrypt(encrypted_data.encode()).decode()
