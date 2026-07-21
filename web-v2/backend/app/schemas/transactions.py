from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator


class SaleItemInput(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=100000)


class SaleCreate(BaseModel):
    customer_id: int = Field(gt=0)
    sale_date: date | None = None
    items: list[SaleItemInput] = Field(min_length=1, max_length=100)


class SaleLineOut(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    selling_price: Decimal
    line_total: Decimal


class SaleOut(BaseModel):
    id: int
    invoice_number: str
    sale_date: date
    customer_id: int
    customer_name: str
    user_id: int
    cashier_name: str
    total_amount: Decimal
    items: list[SaleLineOut]


class PurchaseItemInput(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=100000)
    purchase_price: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class PurchaseCreate(BaseModel):
    supplier_id: int = Field(gt=0)
    purchase_date: date | None = None
    items: list[PurchaseItemInput] = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def validate_items(self) -> "PurchaseCreate":
        if not self.items:
            raise ValueError("At least one purchase item is required")
        return self


class PurchaseLineOut(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    purchase_price: Decimal
    line_total: Decimal


class PurchaseOut(BaseModel):
    id: int
    invoice_number: str
    purchase_date: date
    supplier_id: int
    supplier_name: str
    total_amount: Decimal
    items: list[PurchaseLineOut]

