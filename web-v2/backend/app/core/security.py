from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.core.config import get_settings


# Argon2's secure recommended defaults are applied automatically.
password_hasher = PasswordHasher()


def is_legacy_sha256(value: str) -> bool:
    """Check whether a stored password is an old SHA-256 hash."""
    return len(value) == 64 and all(
        character in "0123456789abcdef"
        for character in value.lower()
    )


def verify_password(
    password: str,
    stored_hash: str,
) -> tuple[bool, bool]:
    """
    Verify a password.

    Returns:
        (is_valid, requires_upgrade)
    """
    if is_legacy_sha256(stored_hash):
        submitted_hash = hashlib.sha256(
            password.encode("utf-8")
        ).hexdigest()

        is_valid = hmac.compare_digest(
            submitted_hash,
            stored_hash.lower(),
        )

        # Upgrade the legacy SHA-256 hash only after a valid login.
        return is_valid, is_valid

    try:
        password_hasher.verify(stored_hash, password)

        requires_upgrade = password_hasher.check_needs_rehash(
            stored_hash
        )

        return True, requires_upgrade

    except (VerificationError, InvalidHashError):
        return False, False


def hash_password(password: str) -> str:
    """Generate a secure Argon2 password hash."""
    return password_hasher.hash(password)


def create_token(
    subject: int,
    role: str,
    token_type: Literal["access", "refresh"],
) -> str:
    """Create a signed JWT access or refresh token."""
    settings = get_settings()

    if token_type == "access":
        lifetime = timedelta(
            minutes=settings.access_token_minutes
        )
    else:
        lifetime = timedelta(
            days=settings.refresh_token_days
        )

    now = datetime.now(UTC)

    payload = {
        "sub": str(subject),
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + lifetime,
        "jti": secrets.token_urlsafe(16),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm="HS256",
    )


def decode_token(
    token: str,
    expected_type: Literal["access", "refresh"],
) -> dict[str, Any]:
    """Decode and validate a JWT token."""
    settings = get_settings()

    payload: dict[str, Any] = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=["HS256"],
        options={
            "require": [
                "sub",
                "role",
                "type",
                "iat",
                "exp",
                "jti",
            ]
        },
    )

    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("Incorrect token type")

    return payload


def new_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token."""
    return secrets.token_urlsafe(32)