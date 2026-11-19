"""Signed account sessions for authenticated players."""
import base64
import hashlib
import hmac
import json
import time
from app.core.config import settings


def issue_account_token(user_id: str) -> str:
    body = base64.urlsafe_b64encode(json.dumps({"sub": user_id, "exp": int(time.time()) + 60 * 60 * 24 * 30}, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(settings.SECRET_KEY.encode(), body.encode(), hashlib.sha256).digest()
    return body + "." + base64.urlsafe_b64encode(signature).decode().rstrip("=")


def verify_account_token(token: str | None) -> str | None:
    if not token:
        return None
    try:
        body, supplied = token.split(".", 1)
        expected = hmac.new(settings.SECRET_KEY.encode(), body.encode(), hashlib.sha256).digest()
        signature = base64.urlsafe_b64decode(supplied + "=" * (-len(supplied) % 4))
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
        if hmac.compare_digest(signature, expected) and payload["exp"] > time.time():
            return str(payload["sub"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return None
    return None


def hash_password(password: str) -> str:
    salt = __import__("secrets").token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1)
    return f"scrypt${salt}${base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, salt, expected = encoded.split("$", 2)
        if algorithm != "scrypt":
            return False
        digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1)
        return hmac.compare_digest(base64.urlsafe_b64encode(digest).decode(), expected)
    except (ValueError, TypeError):
        return False
