import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { SalesHistoryPage, PurchasesHistoryPage } from './pages/HistoryPages'
import { InvoicePage } from './pages/InvoicePage'
import { LoginPage } from './pages/LoginPage'
import { PosPage } from './pages/PosPage'
import { ProductsPage } from './pages/ProductsPage'
import { PurchasePage } from './pages/PurchasePage'
import { ReportsPage } from './pages/ReportsPage'
import { CategoriesPage, CustomersPage, SuppliersPage } from './pages/SimpleCrudPage'
import { NotFoundPage, UnauthorizedPage } from './pages/StatusPages'
import { UsersPage } from './pages/UsersPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import type { Role } from './types'

const all: Role[] = ['Admin', 'Manager', 'Cashier', 'Inventory Officer', 'Purchase Officer', 'Sales Executive']
const dashboard: Role[] = ['Admin', 'Manager', 'Inventory Officer', 'Purchase Officer', 'Sales Executive']
const pos: Role[] = ['Admin', 'Cashier', 'Sales Executive']
const purchase: Role[] = ['Admin', 'Purchase Officer']
const productWrite: Role[] = ['Admin', 'Inventory Officer']
const customer: Role[] = ['Admin', 'Cashier', 'Sales Executive']
const supplier: Role[] = ['Admin', 'Inventory Officer', 'Purchase Officer']
const reports: Role[] = ['Admin', 'Manager', 'Inventory Officer', 'Purchase Officer', 'Sales Executive']
const salesHistory: Role[] = ['Admin', 'Manager', 'Cashier', 'Sales Executive']
const purchaseHistory: Role[] = ['Admin', 'Manager', 'Purchase Officer']

function Allowed({ roles, children }: { roles: Role[]; children: React.ReactNode }) { return <ProtectedRoute roles={roles}>{children}</ProtectedRoute> }
function RoleHome() { const { user } = useAuth(); return user?.role === 'Cashier' ? <Navigate to="/pos" replace /> : <Allowed roles={dashboard}><DashboardPage /></Allowed> }

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute roles={all}><AppLayout /></ProtectedRoute>}>
      <Route index element={<RoleHome />} />
      <Route path="pos" element={<Allowed roles={pos}><PosPage /></Allowed>} />
      <Route path="purchases/new" element={<Allowed roles={purchase}><PurchasePage /></Allowed>} />
      <Route path="products" element={<Allowed roles={all}><ProductsPage /></Allowed>} />
      <Route path="categories" element={<Allowed roles={productWrite}><CategoriesPage /></Allowed>} />
      <Route path="customers" element={<Allowed roles={customer}><CustomersPage /></Allowed>} />
      <Route path="suppliers" element={<Allowed roles={supplier}><SuppliersPage /></Allowed>} />
      <Route path="users" element={<Allowed roles={['Admin']}><UsersPage /></Allowed>} />
      <Route path="reports" element={<Allowed roles={reports}><ReportsPage /></Allowed>} />
      <Route path="sales" element={<Allowed roles={salesHistory}><SalesHistoryPage /></Allowed>} />
      <Route path="sales/:id" element={<Allowed roles={salesHistory}><InvoicePage kind="sales" /></Allowed>} />
      <Route path="purchases" element={<Allowed roles={purchaseHistory}><PurchasesHistoryPage /></Allowed>} />
      <Route path="purchases/:id" element={<Allowed roles={purchaseHistory}><InvoicePage kind="purchases" /></Allowed>} />
      <Route path="unauthorized" element={<UnauthorizedPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
}
