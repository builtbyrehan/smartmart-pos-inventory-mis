from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.core.permissions import ALL_ROLES, roles_for
from app.core.security import hash_password
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


def serialize(row: User) -> UserOut:
    return UserOut(id=row.UserID, username=row.Username, full_name=row.FullName, role=row.Role, is_active=row.IsActive, created_at=row.CreatedAt)


def valid_role(role: str) -> None:
    if role not in ALL_ROLES:
        raise HTTPException(status_code=422, detail=f"Role must be one of: {', '.join(sorted(ALL_ROLES))}")


@router.get("", response_model=list[UserOut])
def list_users(search: str = Query(default="", max_length=100), role: str | None = None, active: bool | None = None, limit: int = Query(default=200, ge=1, le=500), offset: int = Query(default=0, ge=0), db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("users")))) -> list[UserOut]:
    query = select(User)
    if search.strip():
        term = f"%{search.strip()}%"; query = query.where(or_(User.Username.like(term), User.FullName.like(term)))
    if role:
        valid_role(role); query = query.where(User.Role == role)
    if active is not None:
        query = query.where(User.IsActive.is_(active))
    return [serialize(row) for row in db.scalars(query.order_by(User.FullName).offset(offset).limit(limit)).all()]


@router.post("", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("users")))) -> UserOut:
    valid_role(payload.role)
    row = User(Username=payload.username.strip(), PasswordHash=hash_password(payload.password), FullName=payload.full_name.strip(), Role=payload.role, IsActive=True)
    db.add(row)
    try:
        db.commit(); db.refresh(row)
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="Username already exists") from exc
    return serialize(row)


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), current: User = Depends(require_roles(*roles_for("users")))) -> UserOut:
    row = db.get(User, user_id)
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.role is not None:
        valid_role(payload.role); row.Role = payload.role
    if payload.full_name is not None:
        row.FullName = payload.full_name.strip()
    if payload.password is not None:
        row.PasswordHash = hash_password(payload.password)
    if payload.is_active is not None:
        if row.UserID == current.UserID and not payload.is_active:
            raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
        row.IsActive = payload.is_active
    db.commit(); db.refresh(row)
    return serialize(row)
