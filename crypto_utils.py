from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os

# This file path should be added to .gitignore to ensure it's not committed to version control
KEY_FILE = 'encryption_key.key'
ENV_KEY_NAME = 'USER_DATA_ENCRYPTION_KEY'

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

def get_key():
    """Retrieve the encryption key from environment variable or file"""
    # First check environment variable (safer for production)
    env_key = os.environ.get(ENV_KEY_NAME)
    if env_key:
        try:
            # Ensure the key is properly formatted
            return base64.b64decode(env_key.encode())
        except Exception:
            print("WARNING: Invalid encryption key in environment variable")
    
    # Fall back to file-based key
    if not os.path.exists(KEY_FILE):
        generate_key()
    
    with open(KEY_FILE, 'rb') as key_file:
        key = key_file.read()
    return key

def encrypt_data(data):
    """Encrypt string data using Fernet symmetric encryption"""
    if data is None:
        return None
        
    key = get_key()
    f = Fernet(key)
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
        
    key = get_key()
    f = Fernet(key)
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