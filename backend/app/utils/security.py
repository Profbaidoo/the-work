import os
import hmac
import hashlib
import secrets
from werkzeug.security import generate_password_hash, check_password_hash

# Server-side Pepper: Stored in server configuration, NEVER stored in the database
PEPPER = os.getenv("SECURITY_PASSWORD_PEPPER", "CPS_GHANA_SECURE_PEPPER_V1_2026_@#!$")

def generate_salt(length: int = 16) -> str:
    """Generates a cryptographically secure random hexadecimal salt."""
    return secrets.token_hex(length)

def apply_salt_and_pepper(password: str, salt: str) -> str:
    """
    Combines raw password with per-user salt and hashes via HMAC-SHA256 using server pepper.
    Protects against database dumps and pre-computed rainbow table attacks.
    """
    key = PEPPER.encode("utf-8")
    payload = f"{salt}:{password}:{salt}".encode("utf-8")
    return hmac.new(key, payload, hashlib.sha256).hexdigest()

def hash_salted_peppered_password(password: str, salt: str) -> str:
    """Creates a hardened password hash using Salt + Pepper + Werkzeug PBKDF2."""
    pre_hash = apply_salt_and_pepper(password, salt)
    return generate_password_hash(pre_hash, method="pbkdf2:sha256:600000")

def verify_salted_peppered_password(password: str, salt: str, password_hash: str) -> bool:
    """Verifies a password against its salt, pepper, and stored hash."""
    if not salt:
        # Backward-compatible fallback for pre-existing password hashes
        return check_password_hash(password_hash, password)
    pre_hash = apply_salt_and_pepper(password, salt)
    return check_password_hash(password_hash, pre_hash)
