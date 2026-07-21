from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field, field_validator


def optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return value.strip()


class CategoryUpdate(CategoryCreate):
    pass


class CategoryOut(BaseModel):
    id: int
    name: str


class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=20, pattern=r"^[0-9+()\-\s]+$")
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=255)

    _clean_address = field_validator("address")(optional_text)


class CustomerUpdate(CustomerCreate):
    pass


class CustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    email: str | None
    address: str | None


class SupplierCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    contact_person: str | None = Field(default=None, max_length=100)
    phone: str = Field(min_length=7, max_length=20, pattern=r"^[0-9+()\-\s]+$")
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=255)

    _clean_contact = field_validator("contact_person")(optional_text)
    _clean_address = field_validator("address")(optional_text)


class SupplierUpdate(SupplierCreate):
    pass


class SupplierOut(BaseModel):
    id: int
    name: str
    contact_person: str | None
    phone: str
    email: str | None
    address: str | None


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    category_id: int = Field(gt=0)
    supplier_id: int = Field(gt=0)
    barcode: str = Field(min_length=3, max_length=50)
    purchase_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    selling_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    stock_quantity: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=10, ge=0)


class ProductUpdate(ProductCreate):
    is_active: bool = True


class ProductOut(BaseModel):
    id: int
    name: str
    category_id: int
    category_name: str
    supplier_id: int
    supplier_name: str
    barcode: str
    purchase_price: Decimal
    selling_price: Decimal
    stock_quantity: int
    reorder_level: int
    is_active: bool

