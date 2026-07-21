from __future__ import annotations

import json

from sqlalchemy import text

from app.db.session import engine

TABLES = ["Categories", "Users", "Suppliers", "Customers", "Products", "Purchases", "Purchase_Details", "Sales", "Sales_Details"]
VIEWS = ["vw_Low_Inventory_Alert", "vw_Top_10_Profitable_Products", "vw_Monthly_Sales_Summary", "vw_Inventory_Valuation", "vw_Profit_By_Category", "vw_Customer_Purchase_Analysis", "vw_Sales_Invoice_Detail", "vw_Dashboard_Summary"]


def run_read_only_audit() -> dict:
    result: dict = {"tables": {}, "views": {}, "integrity": {}}
    with engine.connect() as connection:
        for table in TABLES:
            result["tables"][table] = connection.scalar(text(f"SELECT COUNT(*) FROM `{table}`"))
        for view in VIEWS:
            result["views"][view] = connection.scalar(text(f"SELECT COUNT(*) FROM `{view}`"))
        result["integrity"]["sales_total_mismatches"] = connection.scalar(text("SELECT COUNT(*) FROM Sales s JOIN (SELECT SaleID, SUM(Quantity * SellingPrice) total FROM Sales_Details GROUP BY SaleID) d ON d.SaleID=s.SaleID WHERE ABS(s.TotalAmount-d.total)>.001"))
        result["integrity"]["purchase_total_mismatches"] = connection.scalar(text("SELECT COUNT(*) FROM Purchases p JOIN (SELECT PurchaseID, SUM(Quantity * PurchasePrice) total FROM Purchase_Details GROUP BY PurchaseID) d ON d.PurchaseID=p.PurchaseID WHERE ABS(p.TotalAmount-d.total)>.001"))
        result["integrity"]["negative_stock_products"] = connection.scalar(text("SELECT COUNT(*) FROM Products WHERE StockQuantity < 0"))
        result["integrity"]["orphan_sale_details"] = connection.scalar(text("SELECT COUNT(*) FROM Sales_Details d LEFT JOIN Sales s ON s.SaleID=d.SaleID LEFT JOIN Products p ON p.ProductID=d.ProductID WHERE s.SaleID IS NULL OR p.ProductID IS NULL"))
        result["integrity"]["orphan_purchase_details"] = connection.scalar(text("SELECT COUNT(*) FROM Purchase_Details d LEFT JOIN Purchases p ON p.PurchaseID=d.PurchaseID LEFT JOIN Products pr ON pr.ProductID=d.ProductID WHERE p.PurchaseID IS NULL OR pr.ProductID IS NULL"))
    return result


if __name__ == "__main__":
    print(json.dumps(run_read_only_audit(), indent=2, default=str))

