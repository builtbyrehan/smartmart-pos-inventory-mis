from __future__ import annotations

import re

from sqlalchemy import extract, func, select, text
from sqlalchemy.orm import Session

from app.db.models import Category, Customer, Product, Purchase, Sale, SaleDetail, Supplier, User


def _snake(value: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "_", value).lower()


def _view(db: Session, view_name: str) -> list[dict] | None:
    """Read an allow-listed existing DSS view on MySQL; tests use portable ORM fallbacks."""
    if db.bind is None or db.bind.dialect.name != "mysql":
        return None
    rows = db.execute(text(f"SELECT * FROM `{view_name}`")).mappings().all()
    return [{_snake(str(key)): value for key, value in row.items()} for row in rows]


def sales_history(db: Session) -> list[dict]:
    rows = db.execute(select(Sale.SaleID, Sale.InvoiceNumber, Sale.SaleDate, Customer.CustomerName, User.FullName, Sale.TotalAmount).select_from(Sale).join(Customer, Customer.CustomerID == Sale.CustomerID).join(User, User.UserID == Sale.UserID).order_by(Sale.SaleDate.desc(), Sale.SaleID.desc())).all()
    return [{"sale_id": r.SaleID, "invoice_number": r.InvoiceNumber, "sale_date": r.SaleDate, "customer": r.CustomerName, "cashier": r.FullName, "total_amount": r.TotalAmount} for r in rows]


def purchase_history(db: Session) -> list[dict]:
    rows = db.execute(select(Purchase.PurchaseID, Purchase.InvoiceNumber, Purchase.PurchaseDate, Supplier.SupplierName, Purchase.TotalAmount).select_from(Purchase).join(Supplier, Supplier.SupplierID == Purchase.SupplierID).order_by(Purchase.PurchaseDate.desc(), Purchase.PurchaseID.desc())).all()
    return [{"purchase_id": r.PurchaseID, "invoice_number": r.InvoiceNumber, "purchase_date": r.PurchaseDate, "supplier": r.SupplierName, "total_amount": r.TotalAmount} for r in rows]


def low_inventory(db: Session) -> list[dict]:
    existing = _view(db, "vw_Low_Inventory_Alert")
    if existing is not None:
        return existing
    rows = db.execute(select(Product, Category.CategoryName, Supplier.SupplierName).select_from(Product).join(Category, Category.CategoryID == Product.CategoryID).join(Supplier, Supplier.SupplierID == Product.SupplierID).where(Product.IsActive.is_(True), Product.StockQuantity <= Product.ReorderLevel).order_by(Product.StockQuantity, Product.ProductName)).unique().all()
    return [{"product_id": p.ProductID, "product_name": p.ProductName, "category_name": c, "stock_quantity": p.StockQuantity, "reorder_level": p.ReorderLevel, "shortage_quantity": max(p.ReorderLevel - p.StockQuantity, 0), "supplier_name": s, "supplier_phone": p.supplier.Phone, "alert_status": "OUT OF STOCK" if p.StockQuantity == 0 else "REORDER NOW"} for p, c, s in rows]


def top_profitable_products(db: Session) -> list[dict]:
    existing = _view(db, "vw_Top_10_Profitable_Products")
    if existing is not None:
        return existing
    rows = db.execute(select(Product.ProductID, Product.ProductName, func.sum(SaleDetail.Quantity).label("units"), func.sum(SaleDetail.Quantity * SaleDetail.SellingPrice).label("revenue"), func.sum(SaleDetail.Quantity * Product.PurchasePrice).label("cost")).select_from(Product).join(SaleDetail, SaleDetail.ProductID == Product.ProductID).group_by(Product.ProductID, Product.ProductName).order_by((func.sum(SaleDetail.Quantity * SaleDetail.SellingPrice) - func.sum(SaleDetail.Quantity * Product.PurchasePrice)).desc()).limit(10)).all()
    return [{"product_id": r.ProductID, "product_name": r.ProductName, "units_sold": r.units, "sales_revenue": r.revenue, "total_cost": r.cost, "total_profit": r.revenue - r.cost, "profit_margin_percent": ((r.revenue - r.cost) / r.revenue * 100) if r.revenue else 0} for r in rows]


def monthly_sales(db: Session) -> list[dict]:
    existing = _view(db, "vw_Monthly_Sales_Summary")
    if existing is not None:
        return existing
    rows = db.execute(select(extract("year", Sale.SaleDate).label("year"), extract("month", Sale.SaleDate).label("month"), func.count(func.distinct(Sale.SaleID)).label("invoices"), func.sum(SaleDetail.Quantity).label("units"), func.sum(SaleDetail.Quantity * SaleDetail.SellingPrice).label("sales"), func.sum(SaleDetail.Quantity * (SaleDetail.SellingPrice - Product.PurchasePrice)).label("profit")).select_from(Sale).join(SaleDetail, SaleDetail.SaleID == Sale.SaleID).join(Product, Product.ProductID == SaleDetail.ProductID).group_by(extract("year", Sale.SaleDate), extract("month", Sale.SaleDate)).order_by(extract("year", Sale.SaleDate), extract("month", Sale.SaleDate))).all()
    return [{"sales_month": f"{int(r.year):04d}-{int(r.month):02d}", "total_invoices": r.invoices, "units_sold": r.units, "total_sales": r.sales, "gross_profit": r.profit, "average_invoice_value": r.sales / r.invoices if r.invoices else 0} for r in rows]


def inventory_valuation(db: Session) -> list[dict]:
    existing = _view(db, "vw_Inventory_Valuation")
    if existing is not None:
        return existing
    rows = db.execute(select(Product, Category.CategoryName).select_from(Product).join(Category, Category.CategoryID == Product.CategoryID).order_by(Product.ProductName)).unique().all()
    return [{"product_id": p.ProductID, "product_name": p.ProductName, "category_name": c, "purchase_price": p.PurchasePrice, "selling_price": p.SellingPrice, "stock_quantity": p.StockQuantity, "inventory_cost_value": p.PurchasePrice * p.StockQuantity, "potential_sales_value": p.SellingPrice * p.StockQuantity, "potential_gross_profit": (p.SellingPrice - p.PurchasePrice) * p.StockQuantity} for p, c in rows]


def profit_by_category(db: Session) -> list[dict]:
    existing = _view(db, "vw_Profit_By_Category")
    if existing is not None:
        return existing
    rows = db.execute(select(Category.CategoryName, func.sum(SaleDetail.Quantity).label("units"), func.sum(SaleDetail.Quantity * SaleDetail.SellingPrice).label("revenue"), func.sum(SaleDetail.Quantity * (SaleDetail.SellingPrice - Product.PurchasePrice)).label("profit")).select_from(Category).join(Product, Product.CategoryID == Category.CategoryID).join(SaleDetail, SaleDetail.ProductID == Product.ProductID).group_by(Category.CategoryID, Category.CategoryName)).all()
    return [{"category_name": r.CategoryName, "units_sold": r.units, "sales_revenue": r.revenue, "total_profit": r.profit, "profit_margin_percent": (r.profit / r.revenue * 100) if r.revenue else 0} for r in rows]


def customer_analysis(db: Session) -> list[dict]:
    existing = _view(db, "vw_Customer_Purchase_Analysis")
    if existing is not None:
        return existing
    rows = db.execute(select(Customer.CustomerID, Customer.CustomerName, func.count(Sale.SaleID).label("purchases"), func.coalesce(func.sum(Sale.TotalAmount), 0).label("spent"), func.coalesce(func.avg(Sale.TotalAmount), 0).label("average")).select_from(Customer).outerjoin(Sale, Sale.CustomerID == Customer.CustomerID).group_by(Customer.CustomerID, Customer.CustomerName)).all()
    return [{"customer_id": r.CustomerID, "customer_name": r.CustomerName, "total_purchases": r.purchases, "total_spent": r.spent, "average_purchase": r.average, "customer_segment": "VIP" if r.spent >= 3000 else "Active" if r.purchases >= 2 else "Regular"} for r in rows]


def sales_invoice_details(db: Session) -> list[dict]:
    existing = _view(db, "vw_Sales_Invoice_Detail")
    if existing is not None:
        return existing
    rows = db.execute(select(Sale.SaleID, Sale.InvoiceNumber, Sale.SaleDate, Customer.CustomerName, User.FullName, Product.ProductName, SaleDetail.Quantity, SaleDetail.SellingPrice).select_from(Sale).join(Customer, Customer.CustomerID == Sale.CustomerID).join(User, User.UserID == Sale.UserID).join(SaleDetail, SaleDetail.SaleID == Sale.SaleID).join(Product, Product.ProductID == SaleDetail.ProductID).order_by(Sale.SaleDate.desc(), Sale.SaleID.desc())).all()
    return [{"sale_id": r.SaleID, "invoice_number": r.InvoiceNumber, "sale_date": r.SaleDate, "customer_name": r.CustomerName, "cashier": r.FullName, "product_name": r.ProductName, "quantity": r.Quantity, "selling_price": r.SellingPrice, "line_total": r.Quantity * r.SellingPrice} for r in rows]


REPORTS = {
    "low-inventory": low_inventory,
    "top-profitable-products": top_profitable_products,
    "monthly-sales": monthly_sales,
    "inventory-valuation": inventory_valuation,
    "profit-by-category": profit_by_category,
    "customer-analysis": customer_analysis,
    "sales-invoice-details": sales_invoice_details,
    "sales-history": sales_history,
    "purchase-history": purchase_history,
}
