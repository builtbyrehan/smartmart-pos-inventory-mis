from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.core.permissions import roles_for
from app.db.models import Category, Product, User
from app.db.session import get_db
from app.schemas.masters import CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["Categories"])


def serialize(row: Category) -> CategoryOut:
    return CategoryOut(id=row.CategoryID, name=row.CategoryName)


@router.get("", response_model=list[CategoryOut])
def list_categories(
    search: str = Query(default="", max_length=100),
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*roles_for("products_read"))),
) -> list[CategoryOut]:
    query = select(Category)
    if search.strip():
        query = query.where(Category.CategoryName.like(f"%{search.strip()}%"))
    return [serialize(row) for row in db.scalars(query.order_by(Category.CategoryName).offset(offset).limit(limit)).all()]


@router.post("", response_model=CategoryOut, status_code=201)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*roles_for("products_write"))),
) -> CategoryOut:
    row = Category(CategoryName=payload.name)
    db.add(row)
    try:
        db.commit()
        db.refresh(row)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Category name already exists") from exc
    return serialize(row)


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*roles_for("products_write"))),
) -> CategoryOut:
    row = db.get(Category, category_id)
    if not row:
        raise HTTPException(status_code=404, detail="Category not found")
    row.CategoryName = payload.name
    try:
        db.commit()
        db.refresh(row)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Category name already exists") from exc
    return serialize(row)


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*roles_for("products_write"))),
) -> None:
    row = db.get(Category, category_id)
    if not row:
        raise HTTPException(status_code=404, detail="Category not found")
    if db.scalar(select(Product.ProductID).where(Product.CategoryID == category_id).limit(1)):
        raise HTTPException(status_code=409, detail="Category is in use by products")
    db.delete(row)
    db.commit()
