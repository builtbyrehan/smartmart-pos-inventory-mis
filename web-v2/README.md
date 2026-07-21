# POS & Inventory MIS — React + FastAPI Edition

This is the full-stack upgrade of the existing Streamlit semester project. It uses the same populated `POS_IMIS` MySQL database. The original Streamlit files one folder above remain available as the fallback version.

## What is included

- React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts, and React Hook Form
- FastAPI, SQLAlchemy 2, Pydantic Settings, MySQL Connector, JWT cookies, CSRF checks, and Argon2
- Server-side permissions for Admin, Manager, Cashier, Inventory Officer, Purchase Officer, and Sales Executive
- Atomic sale and purchase transactions with product row locking and backend-authoritative totals
- Existing MySQL DSS views for dashboard KPIs and all nine managerial reports
- Printable invoice pages, CSV exports, responsive navigation, and readable high-contrast forms
- Pytest and Vitest checks plus production frontend build support

## Prerequisites

- Windows 10/11
- Python 3.12 or newer (Python 3.14 is supported)
- Node.js 20 or newer with npm
- MySQL Server 8.0 running as a Windows service
- The existing populated `POS_IMIS` database

Do **not** execute `POS_IMIS_database.sql` again when your database already exists. That legacy setup script contains reset statements.

## Easiest installation

1. Open the `web-v2` folder.
2. Double-click `install_web_app.bat`.
3. Open `backend\.env` in Notepad.
4. Replace `replace_with_your_mysql_password` with your local MySQL password. Do not add quotation marks.
5. Save the file, then double-click `start_web_app.bat`.
6. Wait for both command windows to report that they are ready, then open <http://127.0.0.1:5173>.

The installer generates a local JWT secret automatically. Never share `backend\.env` or commit it to source control.

## Manual installation commands

Run these commands in PowerShell from the `web-v2` folder:

```powershell
py -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install --upgrade pip
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
cd frontend
npm install
cd ..
```

Edit `backend\.env`, set `DB_PASSWORD`, and replace the sample `JWT_SECRET` with a long random value.

Start the servers in separate PowerShell windows:

```powershell
.\scripts\start_backend.bat
.\scripts\start_frontend.bat
```

Or start both:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_all.ps1
```

## Local URLs

| Service | URL |
|---|---|
| React application | <http://127.0.0.1:5173> |
| FastAPI service | <http://127.0.0.1:8000> |
| OpenAPI documentation | <http://127.0.0.1:8000/docs> |
| API health | <http://127.0.0.1:8000/health> |
| Database health | <http://127.0.0.1:8000/api/v1/health/database> |

Run all live health checks with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\health_check.ps1
```

Run the read-only database integrity audit with:

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.db.audit
```

The audit only uses `SELECT` statements. It checks table/view access, transaction totals, orphan details, and negative stock.

## Demo accounts

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Manager | `manager1` | `manager123` |
| Cashier | `cashier1` | `cash123` |
| Inventory Officer | `usman` | `Usman@123` |
| Purchase Officer | `ayesha` | `Ayesha@123` |
| Sales Executive | `bilal` | `Bilal@123` |

On the first successful login, a legacy SHA-256 password is transparently upgraded to Argon2. The safe startup migration expands only `Users.PasswordHash` to `VARCHAR(255)` when needed; no records are reset or deleted.

## Tests and production build

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m compileall -q app tests
```

Frontend:

```powershell
cd frontend
npm run lint
npm run test
npm run build
```

The backend tests use an isolated in-memory SQLite database and never touch the real `POS_IMIS` database.

## Troubleshooting

- **Access denied for MySQL user:** check `DB_USER` and `DB_PASSWORD` in `backend\.env`; confirm the MySQL service is running.
- **Unknown database `POS_IMIS`:** refresh MySQL Workbench and verify the schema name. Do not rerun the reset script if important data already exists.
- **Password migration error:** the configured MySQL user needs permission to run the one additive `ALTER TABLE Users MODIFY PasswordHash VARCHAR(255) NOT NULL` migration.
- **Port 8000 or 5173 already in use:** close the earlier backend/frontend command window or stop that process, then restart.
- **CORS error:** keep `VITE_API_URL=http://127.0.0.1:8000/api/v1` and ensure `ALLOWED_ORIGINS` includes `http://127.0.0.1:5173`.
- **Repeated 401 after a code change:** sign out, clear cookies for `127.0.0.1`, and sign in again.
- **Blank dashboard/report:** run `scripts\health_check.ps1`, then run the read-only audit and inspect the API command window for the exact error.

## Presentation flow

1. Sign in as Admin and show the live dashboard and role-aware sidebar.
2. Open Products and identify low-stock items.
3. Complete a one-unit POS sale and open its printable invoice.
4. Show that stock decreased once and the invoice appears in Sales History.
5. Save a supplier purchase and show that stock increased.
6. Open monthly sales, top profitable products, inventory valuation, and customer segmentation reports; export one CSV.
7. Sign in as Cashier or Manager and demonstrate restricted navigation and direct API authorization.

