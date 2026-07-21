from app.db.models import User
from app.db.session import SessionLocal
from tests.conftest import authenticate


def test_login_upgrades_legacy_sha256_and_returns_user(client):
    headers = authenticate(client)
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json()["username"] == "admin"
    assert headers["X-CSRF-Token"]
    with SessionLocal() as db:
        stored = db.query(User).filter_by(Username="admin").one().PasswordHash
        assert stored.startswith("$argon2")


def test_role_permission_blocks_cashier_from_product_writes(client):
    headers = authenticate(client, "cashier")
    response = client.post(
        "/api/v1/products",
        headers=headers,
        json={"name": "Tea", "category_id": 1, "supplier_id": 1, "barcode": "100002", "purchase_price": "100.00", "selling_price": "130.00", "stock_quantity": 5, "reorder_level": 2},
    )
    assert response.status_code == 403


def test_login_failure_does_not_create_session(client):
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrong-password"})
    assert response.status_code == 401
    assert client.get("/api/v1/auth/me").status_code == 401


def test_master_data_validation(client):
    headers = authenticate(client)
    invalid_product = client.post("/api/v1/products", headers=headers, json={"name": "Tea", "category_id": 1, "supplier_id": 1, "barcode": "tea-1", "purchase_price": "-1.00", "selling_price": "2.00", "stock_quantity": 0, "reorder_level": 2})
    assert invalid_product.status_code == 422
    invalid_customer = client.post("/api/v1/customers", headers=headers, json={"name": "Customer", "phone": "abc", "email": "not-an-email"})
    assert invalid_customer.status_code == 422
    invalid_supplier = client.post("/api/v1/suppliers", headers=headers, json={"name": "Supplier", "phone": "x"})
    assert invalid_supplier.status_code == 422
