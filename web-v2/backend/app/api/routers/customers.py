from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.core.permissions import roles_for
from app.db.models import Customer, User
from app.db.session import get_db
from app.schemas.masters import CustomerCreate, CustomerOut, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["Customers"])


def serialize(row: Customer) -> CustomerOut:
    return CustomerOut(id=row.CustomerID, name=row.CustomerName, phone=row.Phone, email=row.Email, address=row.Address)


@router.get("", response_model=list[CustomerOut])
def list_customers(
    search: str = Query(default="", max_length=100),
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(*roles_for("customers"))),
) -> list[CustomerOut]:
    query = select(Customer)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.where(or_(Customer.CustomerName.like(term), Customer.Phone.like(term), Customer.Email.like(term)))
    return [serialize(row) for row in db.scalars(query.order_by(Customer.CustomerName).offset(offset).limit(limit)).all()]


@router.post("", response_model=CustomerOut, status_code=201)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("customers")))) -> CustomerOut:
    row = Customer(CustomerName=payload.name.strip(), Phone=payload.phone.strip(), Email=payload.email, Address=payload.address)
    db.add(row)
    try:
        db.commit(); db.refresh(row)
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="Customer email already exists") from exc
    return serialize(row)


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("customers")))) -> CustomerOut:
    row = db.get(Customer, customer_id)
    if not row:
        raise HTTPException(status_code=404, detail="Customer not found")
    row.CustomerName, row.Phone, row.Email, row.Address = payload.name.strip(), payload.phone.strip(), payload.email, payload.address
    try:
        db.commit(); db.refresh(row)
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="Customer email already exists") from exc
    return serialize(row)
