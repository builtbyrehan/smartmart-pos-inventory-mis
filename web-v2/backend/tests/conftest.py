import hashlib
import os
from decimal import Decimal

import pytest

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["JWT_SECRET"] = "test-secret-only-but-long-enough-for-hs256"

from fastapi.testclient import TestClient

from app.db.models import Category, Customer, Product, Supplier, User
from app.db.session import Base, SessionLocal, engine
from app.main import app


@pytest.fixture()
def client() -> TestClient:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        category = Category(CategoryName="Beverages")
        supplier = Supplier(SupplierName="Demo Supplier", ContactPerson="Sam", Phone="03001234567", Email="supplier@example.com", Address="Lahore")
        supplier_two = Supplier(SupplierName="Other Supplier", ContactPerson="Lee", Phone="03111234567", Email="other@example.com", Address="Karachi")
        customer = Customer(CustomerName="Walk-in Customer", Phone="03000000000", Email=None, Address=None)
        admin = User(Username="admin", PasswordHash=hashlib.sha256(b"password123").hexdigest(), FullName="Admin User", Role="Admin", IsActive=True)
        cashier = User(Username="cashier", PasswordHash=hashlib.sha256(b"password123").hexdigest(), FullName="Cashier User", Role="Cashier", IsActive=True)
        db.add_all([category, supplier, supplier_two, customer, admin, cashier]); db.flush()
        db.add(Product(ProductName="Mineral Water", CategoryID=category.CategoryID, SupplierID=supplier.SupplierID, Barcode="100001", PurchasePrice=Decimal("50.00"), SellingPrice=Decimal("80.00"), StockQuantity=10, ReorderLevel=3, IsActive=True))
        db.commit()
    with TestClient(app) as test_client:
        yield test_client


def authenticate(client: TestClient, username: str = "admin") -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"username": username, "password": "password123"})
    assert response.status_code == 200, response.text
    return {"X-CSRF-Token": response.json()["csrf_token"]}
