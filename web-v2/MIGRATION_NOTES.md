# Migration Notes

## Legacy audit

The Streamlit project was inspected before the new implementation was added. Its application code, environment template, launch scripts, database helper, authentication logic, transaction services, and SQL schema remain unchanged outside `web-v2`.

The supplied database script defines nine normalized tables and eight DSS views. Its sample-data verification contract is:

| Object | Expected rows |
|---|---:|
| Categories | 10 |
| Users | 10 |
| Suppliers | 10 |
| Customers | 10 |
| Products | 15 |
| Purchases | 10 |
| Purchase_Details | 16 |
| Sales | 15 |
| Sales_Details | 32 |

The script documents expected revenue of PKR 19,190, gross profit of PKR 3,665, four low-stock products, zero sales-total mismatches, and zero purchase-total mismatches. The SQL relationships and application services were reviewed for header/detail consistency and transaction behavior.

The build workspace cannot directly connect to the MySQL Server running on the user's Windows computer. Therefore, no statement was executed against the live database here. The implementation was verified against an isolated schema-compatible SQLite database, and `python -m app.db.audit` plus `scripts\health_check.ps1` were provided as mandatory read-only local verification gates.

## Preserved behavior and data

- Existing MySQL table names, column names, foreign keys, records, invoice numbers, and DSS views are reused.
- The original Streamlit interface remains runnable as a fallback.
- Sale and purchase totals use `Decimal`/MySQL `DECIMAL`; frontend estimates are never authoritative.
- Sale checkout aggregates duplicate products, locks product rows, checks active status and stock, generates an invoice, writes header/details, and deducts stock in one transaction.
- Purchase receipt verifies supplier ownership, locks product rows, writes header/details, increases stock, and updates the current purchase price in one transaction.
- Existing SHA-256 user hashes remain compatible and are upgraded only after a correct login.

## Safe additive schema compatibility

Argon2 hashes do not fit the legacy `CHAR(64)` password column. On startup, the backend inspects `Users.PasswordHash` and runs only this additive compatibility change when necessary:

```sql
ALTER TABLE Users MODIFY PasswordHash VARCHAR(255) NOT NULL;
```

It does not drop, truncate, recreate, or reseed anything. No original SQL reset script is called.

## Final permission matrix

| Feature | Roles |
|---|---|
| Dashboard | Admin, Manager, Inventory Officer, Purchase Officer, Sales Executive |
| POS checkout | Admin, Cashier, Sales Executive |
| Purchase entry | Admin, Purchase Officer |
| Product read | All roles |
| Product create/update | Admin, Inventory Officer |
| Customer management | Admin, Cashier, Sales Executive |
| Supplier management | Admin, Inventory Officer, Purchase Officer |
| User administration | Admin |
| DSS reports | Admin, Manager, Inventory Officer, Purchase Officer, Sales Executive |
| Sales history | Admin, Manager, Cashier, Sales Executive |
| Purchase history | Admin, Manager, Purchase Officer |

Permissions are checked in both navigation and FastAPI dependencies. Backend checks are authoritative.

## Verification completed in the build workspace

- Python syntax/import compilation
- FastAPI startup through the test client
- Legacy password verification and Argon2 upgrade
- Server-side role rejection
- Atomic sale, stock deduction, and oversell rollback
- Atomic purchase, stock increase, and purchase-price update
- Dashboard contract
- All nine DSS report endpoints and CSV export
- TypeScript compilation and frontend lint command
- Vitest component tests
- Vite production build

Live MySQL health, existing view execution, and browser interaction with the user's populated database must be confirmed locally because that database is not network-accessible from this workspace.

