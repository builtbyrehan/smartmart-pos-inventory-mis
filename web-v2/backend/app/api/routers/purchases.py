from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.core.permissions import ADMIN, MANAGER, PURCHASE
from app.db.models import Purchase, User
from app.db.session import get_db
from app.schemas.transactions import PurchaseCreate, PurchaseOut
from app.services.transactions import create_purchase, load_purchase, _purchase_out

router = APIRouter(prefix="/purchases", tags=["Purchases"])


@router.get("", response_model=list[PurchaseOut])
def list_purchases(limit: int = Query(default=100, ge=1, le=500), db: Session = Depends(get_db), _user: User = Depends(require_roles(ADMIN, MANAGER, PURCHASE))) -> list[PurchaseOut]:
    rows = db.scalars(select(Purchase).order_by(Purchase.PurchaseDate.desc(), Purchase.PurchaseID.desc()).limit(limit)).unique().all()
    return [_purchase_out(row) for row in rows]


@router.get("/{purchase_id}", response_model=PurchaseOut)
def purchase_detail(purchase_id: int, db: Session = Depends(get_db), _user: User = Depends(require_roles(ADMIN, MANAGER, PURCHASE))) -> PurchaseOut:
    return load_purchase(db, purchase_id)


@router.post("", response_model=PurchaseOut, status_code=201)
def receive_stock(payload: PurchaseCreate, db: Session = Depends(get_db), _user: User = Depends(require_roles(ADMIN, PURCHASE))) -> PurchaseOut:
    return create_purchase(db, payload)

