from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.core.permissions import roles_for
from app.db.models import Sale, User
from app.db.session import get_db
from app.schemas.transactions import SaleCreate, SaleOut
from app.services.transactions import create_sale, load_sale, _sale_out

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.get("", response_model=list[SaleOut])
def list_sales(limit: int = Query(default=100, ge=1, le=500), db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("transactions")))) -> list[SaleOut]:
    rows = db.scalars(select(Sale).order_by(Sale.SaleDate.desc(), Sale.SaleID.desc()).limit(limit)).unique().all()
    return [_sale_out(row) for row in rows]


@router.get("/{sale_id}", response_model=SaleOut)
def sale_detail(sale_id: int, db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("transactions")))) -> SaleOut:
    return load_sale(db, sale_id)


@router.post("", response_model=SaleOut, status_code=201)
def checkout(payload: SaleCreate, db: Session = Depends(get_db), user: User = Depends(require_roles(*roles_for("pos")))) -> SaleOut:
    return create_sale(db, payload, user)

