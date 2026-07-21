# POS & Inventory Control Management Information System

This is the operational application for the IMIS semester project. It uses
Python, Streamlit, and MySQL 8.0.

## Features

- Secure login and role-based navigation
- Admin, Manager, Cashier, Inventory Officer, Purchase Officer, and Sales
  Executive roles
- Live management dashboard with KPIs and charts
- Functional point-of-sale cart and checkout
- Automatic stock deduction after a completed sale
- Purchase entry and automatic stock increase
- Product, category, customer, supplier, and user data-entry forms
- Input validation and transactional database updates
- Low-inventory threshold alerts
- Top 10 most profitable products
- Monthly sales and gross-profit analysis
- Inventory valuation, category profit, and customer segmentation
- Sales and purchase audit trails
- Receipt and CSV report downloads

## First-time setup on Windows

The `POS_IMIS` database must already exist in MySQL Workbench. If it does not,
execute `POS_IMIS_database.sql` first.

1. Extract this application folder.
2. Double-click `install_dependencies.bat` and wait until it says installation
   is complete.
3. Copy `.env.example` and rename the copy to `.env`.
4. Open `.env` in Notepad.
5. Replace `PUT_YOUR_MYSQL_ROOT_PASSWORD_HERE` with your local MySQL root
   password. Do not add quotation marks.
6. Save and close `.env`.
7. Open PowerShell in the application folder and run:

   ```powershell
   .\.venv\Scripts\Activate.ps1
   python health_check.py
   ```

   If the virtual environment is in the parent `POS_IMIS` folder instead, run:

   ```powershell
   ..\.venv\Scripts\Activate.ps1
   python health_check.py
   ```

8. After the health check prints `SUCCESS`, double-click `run_app.bat`.
9. The application opens at `http://localhost:8501`.

## Demo login accounts

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `admin123` |
| Cashier | `cashier1` | `cash123` |
| Manager | `manager1` | `manager123` |

Additional users from the sample dataset can also sign in.

## Recommended presentation sequence

1. Sign in as Admin and explain role-based access.
2. Show the management dashboard and KPI values.
3. Open Products and identify the four low-stock items.
4. Complete a sale and show that stock decreases automatically.
5. Record a purchase and show that stock increases automatically.
6. Open DSS Reports and demonstrate the Top 10 Profitable Products chart.
7. Show Monthly Sales Summary, Inventory Valuation, and Customer Analysis.
8. Open Transactions to demonstrate the audit trail and invoice details.

## Security note

The `.env` file contains a local database password and is excluded through
`.gitignore`. Do not send or publish `.env`. The seeded application passwords
are stored as hashes in MySQL. The provided accounts are demonstration accounts
and should be changed before using the application outside a classroom demo.

