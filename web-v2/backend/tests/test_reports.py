from tests.conftest import authenticate


def test_dashboard_and_report_contract(client):
    authenticate(client)
    dashboard = client.get("/api/v1/dashboard")
    assert dashboard.status_code == 200, dashboard.text
    assert set(dashboard.json()) == {"summary", "monthly_sales", "category_profit", "low_stock"}
    assert set(dashboard.json()["summary"]) == {"total_sales_revenue", "gross_profit", "inventory_cost_value", "potential_retail_value", "low_stock_count", "total_products", "sales_invoices", "customers"}
    report_names = ["low-inventory", "top-profitable-products", "monthly-sales", "inventory-valuation", "profit-by-category", "customer-analysis", "sales-invoice-details", "sales-history", "purchase-history"]
    for name in report_names:
        report = client.get(f"/api/v1/reports/{name}")
        assert report.status_code == 200, f"{name}: {report.text}"
        assert set(report.json()) == {"name", "columns", "rows"}
    csv_response = client.get("/api/v1/reports/inventory-valuation/csv")
    assert csv_response.status_code == 200
    assert "product_id" in csv_response.text
