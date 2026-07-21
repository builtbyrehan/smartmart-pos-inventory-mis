import {
  BarChart3,
  Boxes,
  ChevronRight,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  ShoppingCart,
  Store,
  Truck,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  NavLink,
  Outlet,
} from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import type { Role } from '../types'

const all: Role[] = [
  'Admin',
  'Manager',
  'Cashier',
  'Inventory Officer',
  'Purchase Officer',
  'Sales Executive',
]

export const nav = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: all.filter((role) => role !== 'Cashier'),
  },
  {
    to: '/pos',
    label: 'Point of Sale',
    icon: ShoppingCart,
    roles: [
      'Admin',
      'Cashier',
      'Sales Executive',
    ] as Role[],
  },
  {
    to: '/purchases/new',
    label: 'New Purchase',
    icon: PackagePlus,
    roles: [
      'Admin',
      'Purchase Officer',
    ] as Role[],
  },
  {
    to: '/products',
    label: 'Products',
    icon: Boxes,
    roles: all,
  },
  {
    to: '/categories',
    label: 'Categories',
    icon: FolderTree,
    roles: [
      'Admin',
      'Inventory Officer',
    ] as Role[],
  },
  {
    to: '/customers',
    label: 'Customers',
    icon: Users,
    roles: [
      'Admin',
      'Cashier',
      'Sales Executive',
    ] as Role[],
  },
  {
    to: '/suppliers',
    label: 'Suppliers',
    icon: Truck,
    roles: [
      'Admin',
      'Inventory Officer',
      'Purchase Officer',
    ] as Role[],
  },
  {
    to: '/sales',
    label: 'Sales History',
    icon: ReceiptText,
    roles: [
      'Admin',
      'Manager',
      'Cashier',
      'Sales Executive',
    ] as Role[],
  },
  {
    to: '/purchases',
    label: 'Purchase History',
    icon: ClipboardList,
    roles: [
      'Admin',
      'Manager',
      'Purchase Officer',
    ] as Role[],
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: BarChart3,
    roles: [
      'Admin',
      'Manager',
      'Inventory Officer',
      'Purchase Officer',
      'Sales Executive',
    ] as Role[],
  },
  {
    to: '/users',
    label: 'Users',
    icon: UserRound,
    roles: ['Admin'] as Role[],
  },
]

export const navigationForRole = (role: Role) =>
  nav
    .filter((item) => item.roles.includes(role))
    .map((item) => item.to)

export function AppLayout() {
  const { user, logout } = useAuth()

  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const links = nav.filter(
    (item) =>
      user && item.roles.includes(user.role),
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener(
        'keydown',
        closeOnEscape,
      )
    }
  }, [open])

  const closeMobileNavigation = () => {
    setOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="sidebar-backdrop fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
          onClick={closeMobileNavigation}
        />
      ) : null}

      <aside
        id="app-sidebar"
        className={[
          'sidebar-surface fixed inset-y-0 left-0 z-40',
          'flex w-[min(18rem,calc(100vw-2rem))] flex-col overflow-hidden',
          'rounded-r-3xl border-r border-white/10 bg-slate-950 text-white',
          'transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'lg:translate-x-0 lg:rounded-none',
          collapsed ? 'lg:w-20' : 'lg:w-72',
          open
            ? 'translate-x-0'
            : '-translate-x-full',
        ].join(' ')}
      >
        <div
          className={[
            'flex h-20 shrink-0 items-center gap-3',
            'border-b border-white/10 px-5',
            collapsed
              ? 'lg:justify-center lg:px-3'
              : '',
          ].join(' ')}
        >
          <div className="sidebar-brand-icon grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 shadow-lg shadow-brand-950/30">
            <Store
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <div
            className={[
              'min-w-0',
              collapsed ? 'lg:hidden' : '',
            ].join(' ')}
          >
            <p className="truncate font-bold tracking-tight">
              POS &amp; Inventory
            </p>

            <p className="truncate text-xs text-slate-400">
              Management System
            </p>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            className="ml-auto grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 lg:hidden"
            onClick={closeMobileNavigation}
          >
            <X
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>
        </div>

        <nav
          className={[
            'sidebar-scrollbar flex-1 overflow-y-auto overflow-x-hidden',
            'px-4 py-5',
            collapsed ? 'lg:px-2' : '',
          ].join(' ')}
          aria-label="Primary navigation"
        >
          <p
            className={[
              'mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500',
              collapsed ? 'lg:hidden' : '',
            ].join(' ')}
          >
            Workspace
          </p>

          <div className="space-y-1">
            {links.map(
              ({
                to,
                label,
                icon: Icon,
              }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  title={
                    collapsed ? label : undefined
                  }
                  onClick={closeMobileNavigation}
                  className={({ isActive }) =>
                    [
                      'sidebar-nav-item group relative',
                      'flex min-h-11 items-center gap-3 overflow-hidden',
                      'rounded-xl px-3 py-2.5',
                      'text-sm font-medium',
                      'focus-visible:outline-none focus-visible:ring-2',
                      'focus-visible:ring-brand-400 focus-visible:ring-offset-2',
                      'focus-visible:ring-offset-slate-950',
                      collapsed
                        ? 'lg:justify-center lg:px-2'
                        : '',
                      isActive
                        ? 'sidebar-nav-active text-white'
                        : 'text-slate-300 hover:bg-white/[0.07] hover:text-white',
                    ].join(' ')
                  }
                >
                  <Icon
                    className="sidebar-nav-icon h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />

                  <span
                    className={[
                      'min-w-0 flex-1 truncate',
                      collapsed ? 'lg:hidden' : '',
                    ].join(' ')}
                  >
                    {label}
                  </span>

                  <ChevronRight
                    className={[
                      'sidebar-nav-chevron ml-auto h-4 w-4 shrink-0 opacity-50',
                      collapsed ? 'lg:hidden' : '',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                </NavLink>
              ),
            )}
          </div>
        </nav>

        <div className="sidebar-footer shrink-0 border-t border-white/10 bg-slate-950/95 p-4 backdrop-blur">
          <div
            className={[
              'mb-3 rounded-xl border border-white/[0.06] bg-white/[0.05] p-3',
              collapsed
                ? 'lg:grid lg:h-11 lg:w-11 lg:place-items-center lg:p-0'
                : '',
            ].join(' ')}
          >
            <div
              className={[
                'flex min-w-0 items-center gap-3',
                collapsed ? 'lg:hidden' : '',
              ].join(' ')}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600/20 text-brand-100">
                <UserRound
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user?.full_name}
                </p>

                <p className="mt-0.5 truncate text-xs text-brand-100">
                  {user?.role}
                </p>
              </div>
            </div>

            {collapsed ? (
              <UserRound
                className="hidden h-5 w-5 text-brand-100 lg:block"
                aria-hidden="true"
              />
            ) : null}
          </div>

          <button
            type="button"
            title="Sign out"
            className={[
              'sidebar-signout flex min-h-11 w-full items-center gap-3',
              'rounded-xl px-3 py-2 text-sm text-slate-300',
              'transition-colors hover:bg-red-500/10 hover:text-red-200',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-red-400 focus-visible:ring-offset-2',
              'focus-visible:ring-offset-slate-950',
              collapsed
                ? 'lg:justify-center lg:px-2'
                : '',
            ].join(' ')}
            onClick={() => logout()}
          >
            <LogOut
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            />

            <span
              className={
                collapsed ? 'lg:hidden' : ''
              }
            >
              Sign out
            </span>
          </button>
        </div>
      </aside>

      <div
        className={[
          'transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          collapsed
            ? 'lg:pl-20'
            : 'lg:pl-72',
        ].join(' ')}
      >
        <header className="no-print sticky top-0 z-20 flex h-16 items-center border-b border-slate-200/80 bg-white/85 px-4 shadow-sm shadow-slate-950/[0.02] backdrop-blur-xl lg:px-8">
          <button
            type="button"
            aria-label="Open navigation"
            aria-controls="app-sidebar"
            aria-expanded={open}
            className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            aria-label={
              collapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
            aria-controls="app-sidebar"
            aria-expanded={!collapsed}
            className="hidden min-h-11 min-w-11 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 lg:grid"
            onClick={() =>
              setCollapsed(
                (current) => !current,
              )
            }
          >
            {collapsed ? (
              <PanelLeftOpen
                className="h-5 w-5"
                aria-hidden="true"
              />
            ) : (
              <PanelLeftClose
                className="h-5 w-5"
                aria-hidden="true"
              />
            )}
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700 sm:grid">
              <UserRound
                className="h-4 w-4"
                aria-hidden="true"
              />
            </div>

            <div className="text-right">
              <p className="max-w-48 truncate text-sm font-semibold text-slate-800">
                {user?.full_name}
              </p>

              <p className="text-xs text-slate-500">
                {user?.role}
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}