from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.core.permissions import roles_for
from app.db.models import Supplier, User
from app.db.session import get_db
from app.schemas.masters import SupplierCreate, SupplierOut, SupplierUpdate

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


def serialize(row: Supplier) -> SupplierOut:
    return SupplierOut(id=row.SupplierID, name=row.SupplierName, contact_person=row.ContactPerson, phone=row.Phone, email=row.Email, address=row.Address)


@router.get("", response_model=list[SupplierOut])
def list_suppliers(search: str = Query(default="", max_length=100), limit: int = Query(default=200, ge=1, le=500), offset: int = Query(default=0, ge=0), db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("suppliers")))) -> list[SupplierOut]:
    query = select(Supplier)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.where(or_(Supplier.SupplierName.like(term), Supplier.Phone.like(term), Supplier.Email.like(term)))
    return [serialize(row) for row in db.scalars(query.order_by(Supplier.SupplierName).offset(offset).limit(limit)).all()]


@router.post("", response_model=SupplierOut, status_code=201)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("suppliers")))) -> SupplierOut:
    row = Supplier(SupplierName=payload.name.strip(), ContactPerson=payload.contact_person, Phone=payload.phone.strip(), Email=payload.email, Address=payload.address)
    db.add(row)
    try:
        db.commit(); db.refresh(row)
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="Supplier name or email already exists") from exc
    return serialize(row)


@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(supplier_id: int, payload: SupplierUpdate, db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("suppliers")))) -> SupplierOut:
    row = db.get(Supplier, supplier_id)
    if not row:
        raise HTTPException(status_code=404, detail="Supplier not found")
    row.SupplierName, row.ContactPerson, row.Phone = payload.name.strip(), payload.contact_person, payload.phone.strip()
    row.Email, row.Address = payload.email, payload.address
    try:
        db.commit(); db.refresh(row)
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="Supplier name or email already exists") from exc
    return serialize(row)
