from app.db.models import Product, Purchase, Sale
from app.db.session import SessionLocal
from tests.conftest import authenticate


def test_sale_is_atomic_and_uses_server_price(client):
    headers = authenticate(client, "cashier")
    response = client.post("/api/v1/sales", headers=headers, json={"customer_id": 1, "items": [{"product_id": 1, "quantity": 2}]})
    assert response.status_code == 201, response.text
    assert response.json()["total_amount"] == "160.00"
    with SessionLocal() as db:
        assert db.get(Product, 1).StockQuantity == 8
        assert db.query(Sale).count() == 1


def test_oversell_rolls_back_everything(client):
    headers = authenticate(client, "cashier")
    response = client.post("/api/v1/sales", headers=headers, json={"customer_id": 1, "items": [{"product_id": 1, "quantity": 11}]})
    assert response.status_code == 409
    with SessionLocal() as db:
        assert db.get(Product, 1).StockQuantity == 10
        assert db.query(Sale).count() == 0


def test_purchase_updates_stock_and_cost_in_one_transaction(client):
    headers = authenticate(client)
    response = client.post("/api/v1/purchases", headers=headers, json={"supplier_id": 1, "items": [{"product_id": 1, "quantity": 5, "purchase_price": "52.00"}]})
    assert response.status_code == 201, response.text
    assert response.json()["total_amount"] == "260.00"
    with SessionLocal() as db:
        product = db.get(Product, 1)
        assert product.StockQuantity == 15
        assert str(product.PurchasePrice) == "52.00"
        assert db.query(Purchase).count() == 1


def test_purchase_rejects_product_owned_by_another_supplier(client):
    headers = authenticate(client)
    response = client.post("/api/v1/purchases", headers=headers, json={"supplier_id": 2, "items": [{"product_id": 1, "quantity": 2, "purchase_price": "52.00"}]})
    assert response.status_code == 400
    assert "another supplier" in response.json()["detail"]
    with SessionLocal() as db:
        assert db.get(Product, 1).StockQuantity == 10
        assert db.query(Purchase).count() == 0
