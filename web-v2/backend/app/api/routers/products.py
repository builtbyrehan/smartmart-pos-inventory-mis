from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.core.permissions import roles_for
from app.db.models import Category, Product, Supplier, User
from app.db.session import get_db
from app.schemas.masters import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products"])


def serialize(row: Product) -> ProductOut:
    return ProductOut(id=row.ProductID, name=row.ProductName, category_id=row.CategoryID, category_name=row.category.CategoryName, supplier_id=row.SupplierID, supplier_name=row.supplier.SupplierName, barcode=row.Barcode, purchase_price=row.PurchasePrice, selling_price=row.SellingPrice, stock_quantity=row.StockQuantity, reorder_level=row.ReorderLevel, is_active=row.IsActive)


@router.get("", response_model=list[ProductOut])
def list_products(search: str = Query(default="", max_length=100), active_only: bool = False, supplier_id: int | None = None, category_id: int | None = None, low_stock_only: bool = False, limit: int = Query(default=200, ge=1, le=500), offset: int = Query(default=0, ge=0), db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("products_read")))) -> list[ProductOut]:
    query = select(Product)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.where(or_(Product.ProductName.like(term), Product.Barcode.like(term)))
    if active_only:
        query = query.where(Product.IsActive.is_(True))
    if supplier_id:
        query = query.where(Product.SupplierID == supplier_id)
    if category_id:
        query = query.where(Product.CategoryID == category_id)
    if low_stock_only:
        query = query.where(Product.StockQuantity <= Product.ReorderLevel)
    return [serialize(row) for row in db.scalars(query.order_by(Product.ProductName).offset(offset).limit(limit)).unique().all()]


def validate_refs(db: Session, category_id: int, supplier_id: int) -> None:
    if not db.get(Category, category_id):
        raise HTTPException(status_code=400, detail="Category not found")
    if not db.get(Supplier, supplier_id):
        raise HTTPException(status_code=400, detail="Supplier not found")


@router.post("", response_model=ProductOut, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("products_write")))) -> ProductOut:
    validate_refs(db, payload.category_id, payload.supplier_id)
    row = Product(ProductName=payload.name.strip(), CategoryID=payload.category_id, SupplierID=payload.supplier_id, Barcode=payload.barcode.strip(), PurchasePrice=payload.purchase_price, SellingPrice=payload.selling_price, StockQuantity=payload.stock_quantity, ReorderLevel=payload.reorder_level, IsActive=True)
    db.add(row)
    try:
        db.commit(); db.refresh(row)
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="Barcode already exists") from exc
    return serialize(row)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("products_write")))) -> ProductOut:
    row = db.get(Product, product_id)
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    validate_refs(db, payload.category_id, payload.supplier_id)
    row.ProductName, row.CategoryID, row.SupplierID, row.Barcode = payload.name.strip(), payload.category_id, payload.supplier_id, payload.barcode.strip()
    row.PurchasePrice, row.SellingPrice = payload.purchase_price, payload.selling_price
    row.StockQuantity, row.ReorderLevel, row.IsActive = payload.stock_quantity, payload.reorder_level, payload.is_active
    try:
        db.commit(); db.refresh(row)
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="Barcode already exists") from exc
    return serialize(row)
