from __future__ import annotations


ADMIN = "Admin"
MANAGER = "Manager"
CASHIER = "Cashier"
INVENTORY = "Inventory Officer"
PURCHASE = "Purchase Officer"
SALES = "Sales Executive"

ALL_ROLES = {ADMIN, MANAGER, CASHIER, INVENTORY, PURCHASE, SALES}

FEATURE_ROLES: dict[str, set[str]] = {
    "dashboard": {ADMIN, MANAGER, INVENTORY, PURCHASE, SALES},
    "pos": {ADMIN, CASHIER, SALES},
    "purchases": {ADMIN, PURCHASE},
    "products_read": ALL_ROLES,
    "products_write": {ADMIN, INVENTORY},
    "customers": {ADMIN, CASHIER, SALES},
    "suppliers": {ADMIN, INVENTORY, PURCHASE},
    "users": {ADMIN},
    "reports": {ADMIN, MANAGER, INVENTORY, PURCHASE, SALES},
    "transactions": {ADMIN, MANAGER, CASHIER, SALES},
}


def roles_for(feature: str) -> set[str]:
    return FEATURE_ROLES[feature]

