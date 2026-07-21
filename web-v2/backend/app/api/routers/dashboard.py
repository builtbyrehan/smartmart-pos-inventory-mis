from fastapi import APIRouter, Depends
from sqlalchemy import extract, func, select, text
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.core.permissions import roles_for
from app.db.models import Category, Product, Sale, SaleDetail, User
from app.db.session import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def dashboard(db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("dashboard")))) -> dict:
    if db.bind is not None and db.bind.dialect.name == "mysql":
        summary = db.execute(text("SELECT * FROM vw_Dashboard_Summary")).mappings().one()
        monthly = db.execute(text("SELECT * FROM vw_Monthly_Sales_Summary ORDER BY SalesMonth")).mappings().all()
        categories = db.execute(text("SELECT * FROM vw_Profit_By_Category ORDER BY TotalProfit DESC")).mappings().all()
        low = db.execute(text("SELECT * FROM vw_Low_Inventory_Alert ORDER BY StockQuantity, ProductName LIMIT 10")).mappings().all()
        return {
            "summary": {"total_sales_revenue": summary["TotalSalesRevenue"] or 0, "gross_profit": summary["GrossProfit"] or 0, "inventory_cost_value": summary["InventoryCostValue"] or 0, "potential_retail_value": summary["PotentialRetailValue"] or 0, "low_stock_count": summary["LowStockItems"], "total_products": summary["TotalProducts"], "sales_invoices": summary["SalesInvoices"], "customers": summary["RegisteredCustomers"]},
            "monthly_sales": [{"month": row["SalesMonth"], "revenue": row["TotalSales"], "profit": row["GrossProfit"]} for row in monthly],
            "category_profit": [{"category": row["CategoryName"], "revenue": row["SalesRevenue"], "profit": row["TotalProfit"], "margin": row["ProfitMarginPercent"]} for row in categories],
            "low_stock": [{"id": row["ProductID"], "name": row["ProductName"], "stock_quantity": row["StockQuantity"], "reorder_level": row["ReorderLevel"], "supplier": row["SupplierName"], "status": row["AlertStatus"]} for row in low],
        }
    total_revenue = db.scalar(select(func.coalesce(func.sum(Sale.TotalAmount), 0))) or 0
    gross_profit = db.scalar(select(func.coalesce(func.sum(SaleDetail.Quantity * (SaleDetail.SellingPrice - Product.PurchasePrice)), 0)).join(Product)) or 0
    inventory_value = db.scalar(select(func.coalesce(func.sum(Product.PurchasePrice * Product.StockQuantity), 0)).where(Product.IsActive.is_(True))) or 0
    potential_value = db.scalar(select(func.coalesce(func.sum(Product.SellingPrice * Product.StockQuantity), 0)).where(Product.IsActive.is_(True))) or 0
    low_stock_count = db.scalar(select(func.count(Product.ProductID)).where(Product.IsActive.is_(True), Product.StockQuantity <= Product.ReorderLevel)) or 0
    total_products = db.scalar(select(func.count(Product.ProductID))) or 0
    sales_invoices = db.scalar(select(func.count(Sale.SaleID))) or 0
    from app.db.models import Customer
    customers = db.scalar(select(func.count(Customer.CustomerID))) or 0

    month_rows = db.execute(
        select(extract("year", Sale.SaleDate).label("year"), extract("month", Sale.SaleDate).label("month"), func.sum(SaleDetail.Quantity * SaleDetail.SellingPrice).label("revenue"), func.sum(SaleDetail.Quantity * (SaleDetail.SellingPrice - Product.PurchasePrice)).label("profit"))
        .join(SaleDetail).join(Product).group_by(extract("year", Sale.SaleDate), extract("month", Sale.SaleDate))
        .order_by(extract("year", Sale.SaleDate), extract("month", Sale.SaleDate))
    ).all()
    category_rows = db.execute(
        select(Category.CategoryName, func.sum(SaleDetail.Quantity * SaleDetail.SellingPrice).label("revenue"), func.sum(SaleDetail.Quantity * (SaleDetail.SellingPrice - Product.PurchasePrice)).label("profit"))
        .join(Product, Product.CategoryID == Category.CategoryID)
        .join(SaleDetail, SaleDetail.ProductID == Product.ProductID)
        .group_by(Category.CategoryID, Category.CategoryName)
        .order_by(func.sum(SaleDetail.Quantity * SaleDetail.SellingPrice).desc())
    ).all()
    low_rows = db.scalars(
        select(Product).where(Product.IsActive.is_(True), Product.StockQuantity <= Product.ReorderLevel).order_by(Product.StockQuantity, Product.ProductName).limit(10)
    ).unique().all()
    return {
        "summary": {
            "total_sales_revenue": total_revenue,
            "gross_profit": gross_profit,
            "inventory_cost_value": inventory_value,
            "potential_retail_value": potential_value,
            "low_stock_count": low_stock_count,
            "total_products": total_products,
            "sales_invoices": sales_invoices,
            "customers": customers,
        },
        "monthly_sales": [{"month": f"{int(row.year):04d}-{int(row.month):02d}", "revenue": row.revenue, "profit": row.profit} for row in month_rows],
        "category_profit": [{"category": row.CategoryName, "revenue": row.revenue, "profit": row.profit, "margin": (row.profit / row.revenue * 100) if row.revenue else 0} for row in category_rows],
        "low_stock": [{"id": row.ProductID, "name": row.ProductName, "stock_quantity": row.StockQuantity, "reorder_level": row.ReorderLevel} for row in low_rows],
    }
