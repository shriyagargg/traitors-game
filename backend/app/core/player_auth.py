"""Signed, expiring player credentials for anonymous game sessions."""
import base64
import hashlib
import hmac
import json
import time
from app.core.config import settings


def issue_player_token(room_code: str, player_id: str) -> str:
    payload = json.dumps({"room": room_code.upper(), "player": player_id,
                          "exp": int(time.time()) + 60 * 60 * 24 * 30},
                         separators=(",", ":")).encode()
    body = base64.urlsafe_b64encode(payload).decode().rstrip("=")
    signature = hmac.new(settings.SECRET_KEY.encode(), body.encode(), hashlib.sha256).digest()
    return body + "." + base64.urlsafe_b64encode(signature).decode().rstrip("=")


def verify_player_token(token: str | None, room_code: str, player_id: str) -> bool:
    if not token:
        return False
    try:
        body, supplied = token.split(".", 1)
        expected = hmac.new(settings.SECRET_KEY.encode(), body.encode(), hashlib.sha256).digest()
        signature = base64.urlsafe_b64decode(supplied + "=" * (-len(supplied) % 4))
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
        return (hmac.compare_digest(signature, expected) and payload["exp"] > time.time()
                and payload["room"] == room_code.upper() and payload["player"] == player_id)
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return False
