from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime
import hmac
from threading import Lock
from time import monotonic

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import get_settings
from app.core.security import create_token, decode_token, hash_password, new_csrf_token, verify_password
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import AuthResponse, LoginRequest, UserSummary
from app.schemas.common import MessageResponse


router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


class LoginRateLimiter:
    def __init__(self, attempts: int = 5, window_seconds: int = 60) -> None:
        self.attempts = attempts
        self.window_seconds = window_seconds
        self.events: dict[str, deque[float]] = defaultdict(deque)
        self.lock = Lock()

    def check(self, key: str) -> None:
        now = monotonic()
        with self.lock:
            events = self.events[key]
            while events and now - events[0] > self.window_seconds:
                events.popleft()
            if len(events) >= self.attempts:
                raise HTTPException(status_code=429, detail="Too many login attempts. Try again shortly.")

    def record_failure(self, key: str) -> None:
        with self.lock:
            self.events[key].append(monotonic())

    def clear(self, key: str) -> None:
        with self.lock:
            self.events.pop(key, None)


limiter = LoginRateLimiter()


def _user_summary(user: User) -> UserSummary:
    return UserSummary(
        id=user.UserID,
        username=user.Username,
        full_name=user.FullName,
        role=user.Role,
        is_active=user.IsActive,
    )


def _set_auth_cookies(response: Response, user: User) -> str:
    access_token = create_token(user.UserID, user.Role, "access")
    refresh_token = create_token(user.UserID, user.Role, "refresh")
    csrf_token = new_csrf_token()
    common = {
        "secure": settings.cookie_secure,
        "samesite": "lax",
    }
    response.set_cookie(
        "pos_access_token",
        access_token,
        httponly=True,
        max_age=settings.access_token_minutes * 60,
        path="/",
        **common,
    )
    response.set_cookie(
        "pos_refresh_token",
        refresh_token,
        httponly=True,
        max_age=settings.refresh_token_days * 86400,
        path=f"{settings.api_prefix}/auth",
        **common,
    )
    response.set_cookie(
        "pos_csrf_token",
        csrf_token,
        httponly=False,
        max_age=settings.refresh_token_days * 86400,
        path="/",
        **common,
    )
    return csrf_token


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    client_host = request.client.host if request.client else "unknown"
    client_key = f"{client_host}:{payload.username.strip().lower()}"
    limiter.check(client_key)
    user = db.scalar(select(User).where(User.Username == payload.username.strip()))
    if not user or not user.IsActive:
        limiter.record_failure(client_key)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    valid, requires_upgrade = verify_password(payload.password, user.PasswordHash)
    if not valid:
        limiter.record_failure(client_key)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    limiter.clear(client_key)
    if requires_upgrade:
        try:
            user.PasswordHash = hash_password(payload.password)
            db.commit()
        except SQLAlchemyError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Password security migration is required. Run the backend migration command.",
            ) from exc
    csrf_token = _set_auth_cookies(response, user)
    return AuthResponse(user=_user_summary(user), csrf_token=csrf_token)


@router.get("/me", response_model=UserSummary)
def current_user(user: User = Depends(get_current_user)) -> UserSummary:
    return _user_summary(user)


@router.post("/refresh", response_model=AuthResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    token = request.cookies.get("pos_refresh_token")
    csrf_cookie = request.cookies.get("pos_csrf_token", "")
    csrf_header = request.headers.get("X-CSRF-Token", "")
    if not csrf_cookie or not csrf_header or not hmac.compare_digest(csrf_cookie, csrf_header):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh session unavailable")
    try:
        payload = decode_token(token, "refresh")
        user = db.get(User, int(payload["sub"]))
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh session expired") from exc
    if not user or not user.IsActive:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive or unavailable")
    csrf_token = _set_auth_cookies(response, user)
    return AuthResponse(user=_user_summary(user), csrf_token=csrf_token)


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response, _user: User = Depends(get_current_user)) -> MessageResponse:
    response.delete_cookie("pos_access_token", path="/")
    response.delete_cookie("pos_refresh_token", path=f"{settings.api_prefix}/auth")
    response.delete_cookie("pos_csrf_token", path="/")
    return MessageResponse(message="Signed out successfully")
