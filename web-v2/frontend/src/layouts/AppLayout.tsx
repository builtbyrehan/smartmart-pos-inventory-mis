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
import { PageTransition } from '../components/PageTransition'
import { ThemeToggle } from '../components/ui'
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
    roles: ['Admin', 'Cashier', 'Sales Executive'] as Role[],
  },
  {
    to: '/purchases/new',
    label: 'New Purchase',
    icon: PackagePlus,
    roles: ['Admin', 'Purchase Officer'] as Role[],
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
    roles: ['Admin', 'Inventory Officer'] as Role[],
  },
  {
    to: '/customers',
    label: 'Customers',
    icon: Users,
    roles: ['Admin', 'Cashier', 'Sales Executive'] as Role[],
  },
  {
    to: '/suppliers',
    label: 'Suppliers',
    icon: Truck,
    roles: ['Admin', 'Inventory Officer', 'Purchase Officer'] as Role[],
  },
  {
    to: '/sales',
    label: 'Sales History',
    icon: ReceiptText,
    roles: ['Admin', 'Manager', 'Cashier', 'Sales Executive'] as Role[],
  },
  {
    to: '/purchases',
    label: 'Purchase History',
    icon: ClipboardList,
    roles: ['Admin', 'Manager', 'Purchase Officer'] as Role[],
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
    (item) => user && item.roles.includes(user.role),
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const closeMobileNavigation = () => setOpen(false)

  return (
    <div className="relative min-h-screen">
      {/* Ambient background */}
      <div className="app-orb app-orb-one" aria-hidden="true" />
      <div className="app-orb app-orb-two" aria-hidden="true" />
      <div className="app-orb app-orb-three" aria-hidden="true" />

      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="sidebar-backdrop fixed inset-0 z-30 bg-bg/70 backdrop-blur-sm lg:hidden"
          onClick={closeMobileNavigation}
        />
      ) : null}

      <aside
        id="app-sidebar"
        className={[
          'sidebar-surface fixed inset-y-0 left-0 z-40',
          'flex flex-col overflow-hidden',
          'w-[min(18rem,calc(100vw-2rem))]',
          'border-r border-border bg-card text-fg',
          'transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'lg:translate-x-0',
          collapsed ? 'lg:w-[4.5rem]' : 'lg:w-64',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div
          className={[
            'flex h-16 shrink-0 items-center gap-3 border-b border-border px-4',
            collapsed ? 'lg:justify-center lg:px-3' : '',
          ].join(' ')}
        >
          <div className="sidebar-brand-icon grid h-9 w-9 shrink-0 place-items-center rounded-lg">
            <Store className="h-4.5 w-4.5" aria-hidden="true" />
          </div>

          <div className={['min-w-0', collapsed ? 'lg:hidden' : ''].join(' ')}>
            <p className="truncate text-sm font-bold tracking-tight text-fg">
              POS &amp; Inventory
            </p>
            <p className="truncate text-xs text-muted">
              Management System
            </p>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            className="ml-auto grid min-h-9 min-w-9 place-items-center rounded-lg text-muted transition hover:bg-card-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden"
            onClick={closeMobileNavigation}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav
          className={[
            'flex-1 overflow-y-auto overflow-x-hidden px-4 py-5',
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
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                title={collapsed ? label : undefined}
                onClick={closeMobileNavigation}
                className={({ isActive }) => [
                  'sidebar-nav-item group relative',
                  'flex min-h-10 items-center gap-3 overflow-hidden rounded-lg px-3 py-2',
                  'text-sm font-medium',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                  'focus-visible:ring-offset-card',
                  collapsed ? 'lg:justify-center lg:px-2' : '',
                  isActive
                    ? 'sidebar-nav-active'
                    : 'text-muted hover:bg-card-2 hover:text-fg',
                ].join(' ')}
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
            ))}
          </div>
        </nav>

        <div className="sidebar-footer shrink-0 border-t border-border bg-card-2 p-4">
          <div
            className={[
              'mb-3 rounded-lg border border-border bg-card p-3',
              collapsed
                ? 'lg:grid lg:h-10 lg:w-10 lg:place-items-center lg:p-0'
                : '',
            ].join(' ')}
          >
            <div
              className={[
                'flex min-w-0 items-center gap-2.5',
                collapsed ? 'lg:hidden' : '',
              ].join(' ')}
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft">
                <UserRound className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">
                  {user?.full_name}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {user?.role}
                </p>
              </div>
            </div>

            {collapsed ? (
              <UserRound
                className="hidden h-4 w-4 text-muted lg:block"
                aria-hidden="true"
              />
            ) : null}
          </div>

          <button
            type="button"
            title="Sign out"
            className={[
              'sidebar-signout flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted',
              'transition-colors hover:bg-danger-soft hover:text-danger',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-danger focus-visible:ring-offset-2',
              'focus-visible:ring-offset-card',
              collapsed ? 'lg:justify-center lg:px-2' : '',
            ].join(' ')}
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className={collapsed ? 'lg:hidden' : ''}>Sign out</span>
          </button>
        </div>
      </aside>

      <div
        className={[
          'relative z-10 transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64',
        ].join(' ')}
      >
        <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-bg/80 px-4 backdrop-blur-xl lg:px-8">
          <button
            type="button"
            aria-label="Open navigation"
            aria-controls="app-sidebar"
            aria-expanded={open}
            className="grid min-h-11 min-w-11 place-items-center rounded-xl text-muted transition hover:bg-card-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-controls="app-sidebar"
            aria-expanded={!collapsed}
            className="hidden min-h-11 min-w-11 place-items-center rounded-xl text-muted transition hover:bg-card-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:grid"
            onClick={() => setCollapsed((current) => !current)}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />

            <div className="hidden h-9 w-9 place-items-center rounded-xl bg-accent-soft text-brand-300 sm:grid">
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </div>

            <div className="text-right">
              <p className="max-w-48 truncate text-sm font-semibold text-fg">
                {user?.full_name}
              </p>
              <p className="text-xs text-muted">{user?.role}</p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] p-6 md:p-8 lg:p-10">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
