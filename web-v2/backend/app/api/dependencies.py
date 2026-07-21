from __future__ import annotations

import hmac
from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.models import User
from app.db.session import get_db


bearer = HTTPBearer(auto_error=False)
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def _request_token(
    request: Request, credentials: HTTPAuthorizationCredentials | None
) -> str | None:
    if credentials:
        return credentials.credentials
    return request.cookies.get("pos_access_token")


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    token = _request_token(request, credentials)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload = decode_token(token, "access")
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session") from exc

    user = db.get(User, user_id)
    if not user or not user.IsActive:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive or unavailable")

    if request.method.upper() not in SAFE_METHODS and credentials is None:
        cookie_token = request.cookies.get("pos_csrf_token", "")
        header_token = request.headers.get("X-CSRF-Token", "")
        if not cookie_token or not header_token or not hmac.compare_digest(cookie_token, header_token):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")
    return user


def require_roles(*allowed_roles: str) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.Role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your role cannot perform this action")
        return user

    return dependency

