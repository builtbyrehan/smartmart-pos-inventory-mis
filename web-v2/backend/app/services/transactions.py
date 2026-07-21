from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime
from decimal import Decimal
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.models import Customer, Product, Purchase, PurchaseDetail, Sale, SaleDetail, Supplier, User
from app.schemas.transactions import PurchaseCreate, PurchaseOut, SaleCreate, SaleOut


def _sale_out(sale: Sale) -> SaleOut:
    return SaleOut(
        id=sale.SaleID,
        invoice_number=sale.InvoiceNumber,
        sale_date=sale.SaleDate,
        customer_id=sale.CustomerID,
        customer_name=sale.customer.CustomerName,
        user_id=sale.UserID,
        cashier_name=sale.user.FullName,
        total_amount=sale.TotalAmount,
        items=[
            {
                "product_id": line.ProductID,
                "product_name": line.product.ProductName,
                "quantity": line.Quantity,
                "selling_price": line.SellingPrice,
                "line_total": line.SellingPrice * line.Quantity,
            }
            for line in sale.details
        ],
    )


def _purchase_out(purchase: Purchase) -> PurchaseOut:
    return PurchaseOut(
        id=purchase.PurchaseID,
        invoice_number=purchase.InvoiceNumber,
        purchase_date=purchase.PurchaseDate,
        supplier_id=purchase.SupplierID,
        supplier_name=purchase.supplier.SupplierName,
        total_amount=purchase.TotalAmount,
        items=[
            {
                "product_id": line.ProductID,
                "product_name": line.product.ProductName,
                "quantity": line.Quantity,
                "purchase_price": line.PurchasePrice,
                "line_total": line.PurchasePrice * line.Quantity,
            }
            for line in purchase.details
        ],
    )


def create_sale(db: Session, payload: SaleCreate, user: User) -> SaleOut:
    quantities: dict[int, int] = defaultdict(int)
    for line in payload.items:
        quantities[line.product_id] += line.quantity
    product_ids = list(quantities)

    try:
        customer = db.get(Customer, payload.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        products = db.scalars(
            select(Product)
            .where(Product.ProductID.in_(product_ids), Product.IsActive.is_(True))
            .with_for_update()
        ).all()
        product_map = {product.ProductID: product for product in products}
        if len(product_map) != len(product_ids):
            raise HTTPException(status_code=400, detail="One or more products are unavailable")

        total = Decimal("0.00")
        detail_rows: list[tuple[Product, int, Decimal]] = []
        for product_id, quantity in quantities.items():
            product = product_map[product_id]
            if quantity > product.StockQuantity:
                raise HTTPException(
                    status_code=409,
                    detail=f"Only {product.StockQuantity} units of {product.ProductName} are available",
                )
            price = Decimal(product.SellingPrice)
            total += price * quantity
            detail_rows.append((product, quantity, price))

        invoice_number = f"SAL-{datetime.now():%Y%m%d%H%M%S}-{uuid4().hex[:6].upper()}"
        sale = Sale(
            CustomerID=customer.CustomerID,
            UserID=user.UserID,
            SaleDate=payload.sale_date or date.today(),
            InvoiceNumber=invoice_number,
            TotalAmount=total,
        )
        db.add(sale)
        db.flush()
        for product, quantity, price in detail_rows:
            if product.StockQuantity < quantity:
                raise HTTPException(status_code=409, detail="Stock changed during checkout; refresh and try again")
            product.StockQuantity -= quantity
            db.add(
                SaleDetail(
                    SaleID=sale.SaleID,
                    ProductID=product.ProductID,
                    Quantity=quantity,
                    SellingPrice=price,
                )
            )
        db.commit()
        refreshed = db.scalar(select(Sale).where(Sale.SaleID == sale.SaleID))
        if not refreshed:
            raise HTTPException(status_code=500, detail="Sale was saved but could not be reloaded")
        return _sale_out(refreshed)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Sale could not be completed") from exc


def create_purchase(db: Session, payload: PurchaseCreate) -> PurchaseOut:
    normalized: dict[int, tuple[int, Decimal]] = {}
    for line in payload.items:
        if line.product_id in normalized:
            old_quantity, old_price = normalized[line.product_id]
            if old_price != line.purchase_price:
                raise HTTPException(status_code=400, detail="Duplicate purchase items must use the same price")
            normalized[line.product_id] = (old_quantity + line.quantity, line.purchase_price)
        else:
            normalized[line.product_id] = (line.quantity, line.purchase_price)
    product_ids = list(normalized)

    try:
        supplier = db.get(Supplier, payload.supplier_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        products = db.scalars(
            select(Product)
            .where(Product.ProductID.in_(product_ids), Product.IsActive.is_(True))
            .with_for_update()
        ).all()
        product_map = {product.ProductID: product for product in products}
        if len(product_map) != len(product_ids):
            raise HTTPException(status_code=400, detail="One or more products are unavailable")
        wrong_supplier = [
            product.ProductName
            for product in products
            if product.SupplierID != payload.supplier_id
        ]
        if wrong_supplier:
            raise HTTPException(
                status_code=400,
                detail="Products assigned to another supplier: " + ", ".join(wrong_supplier),
            )

        total = sum(
            Decimal(price) * quantity for quantity, price in normalized.values()
        )
        invoice_number = f"PUR-{datetime.now():%Y%m%d%H%M%S}-{uuid4().hex[:6].upper()}"
        purchase = Purchase(
            SupplierID=supplier.SupplierID,
            PurchaseDate=payload.purchase_date or date.today(),
            InvoiceNumber=invoice_number,
            TotalAmount=total,
        )
        db.add(purchase)
        db.flush()
        for product_id, (quantity, price) in normalized.items():
            product = product_map[product_id]
            product.StockQuantity += quantity
            product.PurchasePrice = price
            db.add(
                PurchaseDetail(
                    PurchaseID=purchase.PurchaseID,
                    ProductID=product.ProductID,
                    Quantity=quantity,
                    PurchasePrice=price,
                )
            )
        db.commit()
        refreshed = db.scalar(select(Purchase).where(Purchase.PurchaseID == purchase.PurchaseID))
        if not refreshed:
            raise HTTPException(status_code=500, detail="Purchase was saved but could not be reloaded")
        return _purchase_out(refreshed)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Purchase could not be completed") from exc


def load_sale(db: Session, sale_id: int) -> SaleOut:
    sale = db.scalar(select(Sale).where(Sale.SaleID == sale_id))
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return _sale_out(sale)


def load_purchase(db: Session, purchase_id: int) -> PurchaseOut:
    purchase = db.scalar(select(Purchase).where(Purchase.PurchaseID == purchase_id))
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return _purchase_out(purchase)
