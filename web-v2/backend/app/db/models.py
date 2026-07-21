from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Category(Base):
    __tablename__ = "Categories"

    CategoryID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    CategoryName: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)


class User(Base):
    __tablename__ = "Users"

    UserID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    Username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    PasswordHash: Mapped[str] = mapped_column(String(255), nullable=False)
    FullName: Mapped[str] = mapped_column(String(100), nullable=False)
    Role: Mapped[str] = mapped_column(String(50), nullable=False)
    IsActive: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    CreatedAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())


class Supplier(Base):
    __tablename__ = "Suppliers"

    SupplierID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    SupplierName: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    ContactPerson: Mapped[str | None] = mapped_column(String(100))
    Phone: Mapped[str] = mapped_column(String(20), nullable=False)
    Email: Mapped[str | None] = mapped_column(String(100), unique=True)
    Address: Mapped[str | None] = mapped_column(String(255))


class Customer(Base):
    __tablename__ = "Customers"

    CustomerID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    CustomerName: Mapped[str] = mapped_column(String(100), nullable=False)
    Phone: Mapped[str] = mapped_column(String(20), nullable=False)
    Email: Mapped[str | None] = mapped_column(String(100), unique=True)
    Address: Mapped[str | None] = mapped_column(String(255))


class Product(Base):
    __tablename__ = "Products"

    ProductID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ProductName: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    CategoryID: Mapped[int] = mapped_column(ForeignKey("Categories.CategoryID"), nullable=False)
    SupplierID: Mapped[int] = mapped_column(ForeignKey("Suppliers.SupplierID"), nullable=False)
    Barcode: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    PurchasePrice: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    SellingPrice: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    StockQuantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ReorderLevel: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    IsActive: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    CreatedAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    category: Mapped[Category] = relationship(lazy="joined")
    supplier: Mapped[Supplier] = relationship(lazy="joined")


class Purchase(Base):
    __tablename__ = "Purchases"

    PurchaseID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    SupplierID: Mapped[int] = mapped_column(ForeignKey("Suppliers.SupplierID"), nullable=False)
    PurchaseDate: Mapped[date] = mapped_column(Date, nullable=False)
    InvoiceNumber: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    TotalAmount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    CreatedAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    supplier: Mapped[Supplier] = relationship(lazy="joined")
    details: Mapped[list["PurchaseDetail"]] = relationship(
        back_populates="purchase", cascade="all, delete-orphan", lazy="selectin"
    )


class PurchaseDetail(Base):
    __tablename__ = "Purchase_Details"

    PurchaseDetailID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    PurchaseID: Mapped[int] = mapped_column(ForeignKey("Purchases.PurchaseID"), nullable=False)
    ProductID: Mapped[int] = mapped_column(ForeignKey("Products.ProductID"), nullable=False)
    Quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    PurchasePrice: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    purchase: Mapped[Purchase] = relationship(back_populates="details")
    product: Mapped[Product] = relationship(lazy="joined")


class Sale(Base):
    __tablename__ = "Sales"

    SaleID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    CustomerID: Mapped[int] = mapped_column(ForeignKey("Customers.CustomerID"), nullable=False)
    UserID: Mapped[int] = mapped_column(ForeignKey("Users.UserID"), nullable=False)
    SaleDate: Mapped[date] = mapped_column(Date, nullable=False)
    InvoiceNumber: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    TotalAmount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    CreatedAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    customer: Mapped[Customer] = relationship(lazy="joined")
    user: Mapped[User] = relationship(lazy="joined")
    details: Mapped[list["SaleDetail"]] = relationship(
        back_populates="sale", cascade="all, delete-orphan", lazy="selectin"
    )


class SaleDetail(Base):
    __tablename__ = "Sales_Details"

    SaleDetailID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    SaleID: Mapped[int] = mapped_column(ForeignKey("Sales.SaleID"), nullable=False)
    ProductID: Mapped[int] = mapped_column(ForeignKey("Products.ProductID"), nullable=False)
    Quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    SellingPrice: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    sale: Mapped[Sale] = relationship(back_populates="details")
    product: Mapped[Product] = relationship(lazy="joined")

