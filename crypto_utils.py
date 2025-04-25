from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
import functools

# This file path should be added to .gitignore to ensure it's not committed to version control
KEY_FILE = 'encryption_key.key'
ENV_KEY_NAME = 'USER_DATA_ENCRYPTION_KEY'

# Cache for key and Fernet instance
_KEY_CACHE = None
_FERNET_INSTANCE = None

def generate_key():
    """Generate a new encryption key and save it to a file"""
    if os.environ.get(ENV_KEY_NAME):
        # If key is in environment variable, we don't need to generate one
        return
        
    if not os.path.exists(KEY_FILE):
        key = Fernet.generate_key()
        with open(KEY_FILE, 'wb') as key_file:
            key_file.write(key)
        print(f"Generated new encryption key and stored in {KEY_FILE}")
        print(f"For production use, set this key as an environment variable named {ENV_KEY_NAME}")

@functools.lru_cache(maxsize=1)
def get_key():
    """Retrieve the encryption key from environment variable or file with caching"""
    global _KEY_CACHE
    
    # Return cached key if available
    if _KEY_CACHE is not None:
        return _KEY_CACHE
    
    # First check environment variable (safer for production)
    env_key = os.environ.get(ENV_KEY_NAME)
    if env_key:
        try:
            # Ensure the key is properly formatted
            _KEY_CACHE = base64.b64decode(env_key.encode())
            return _KEY_CACHE
        except Exception:
            print("WARNING: Invalid encryption key in environment variable")
    
    # Fall back to file-based key
    if not os.path.exists(KEY_FILE):
        generate_key()
    
    with open(KEY_FILE, 'rb') as key_file:
        _KEY_CACHE = key_file.read()
        
    return _KEY_CACHE

def get_fernet():
    """Get or create a cached Fernet instance"""
    global _FERNET_INSTANCE
    
    if _FERNET_INSTANCE is None:
        key = get_key()
        _FERNET_INSTANCE = Fernet(key)
        
    return _FERNET_INSTANCE

def encrypt_data(data):
    """Encrypt string data using Fernet symmetric encryption"""
    if data is None:
        return None
    
    # Use cached Fernet instance
    f = get_fernet()
    # Convert string to bytes
    data_bytes = data.encode('utf-8')
    # Encrypt the data
    encrypted_data = f.encrypt(data_bytes)
    # Return base64 encoded string for storage
    return base64.b64encode(encrypted_data).decode('utf-8')

def decrypt_data(encrypted_data):
    """Decrypt previously encrypted data"""
    if encrypted_data is None:
        return None
    
    # Use cached Fernet instance
    f = get_fernet()
    # Convert from base64 string to bytes
    try:
        encrypted_bytes = base64.b64decode(encrypted_data.encode('utf-8'))
        # Decrypt the data
        decrypted_data = f.decrypt(encrypted_bytes)
        # Return as string
        return decrypted_data.decode('utf-8')
    except Exception as e:
        print(f"Error decrypting data: {e}")
        return encrypted_data  # Return original if decryption fails

# Create a key when module is imported
generate_key() 