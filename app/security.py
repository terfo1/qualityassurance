import base64
import hashlib
import hmac
import secrets
import time

from app.config import settings


def hash_password(password: str, salt: str | None = None) -> str:
    salt_value = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_value.encode("utf-8"), 120000)
    return f"pbkdf2_sha256${salt_value}${base64.b64encode(digest).decode('utf-8')}"


def verify_password(password: str, hashed_password: str) -> bool:
    algorithm, salt, digest = hashed_password.split("$", 2)
    if algorithm != "pbkdf2_sha256":
        return False
    expected = hash_password(password, salt)
    return hmac.compare_digest(expected, hashed_password)


def create_token(user_id: int) -> str:
    timestamp = str(int(time.time()))
    nonce = secrets.token_hex(8)
    payload = f"{user_id}:{timestamp}:{nonce}"
    signature = hmac.new(settings.auth_secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    encoded = base64.urlsafe_b64encode(f"{payload}:{signature}".encode("utf-8")).decode("utf-8")
    return encoded


def decode_token(token: str) -> int | None:
    try:
        raw = base64.urlsafe_b64decode(token.encode("utf-8")).decode("utf-8")
        user_id, timestamp, nonce, signature = raw.split(":", 3)
        payload = f"{user_id}:{timestamp}:{nonce}"
        expected = hmac.new(settings.auth_secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            return None
        return int(user_id)
    except Exception:
        return None
