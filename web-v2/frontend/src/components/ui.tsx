import {
  AlertCircle,
  CheckCircle2,
  Info,
  LoaderCircle,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'

import { useTheme } from '../theme/useTheme'

/* --------------------------------------------------------------------------
   Spinner
   -------------------------------------------------------------------------- */
export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-muted">
      <LoaderCircle className="spin-soft h-6 w-6 text-brand-400" />
      <span className="text-sm font-medium">{label}…</span>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Page header
   -------------------------------------------------------------------------- */
export function PageHeader({
  title,
  subtitle,
  action,
  icon: Icon,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ComponentType<{ className?: string }>
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="icon-chip mt-1 h-11 w-11 bg-accent-soft text-brand-300 glow-brand">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  )
}

/* --------------------------------------------------------------------------
   Alert
   -------------------------------------------------------------------------- */
const alertTones = {
  error: {
    wrap: 'border-danger/30 bg-danger-soft text-danger',
    Icon: AlertCircle,
  },
  success: {
    wrap: 'border-success/30 bg-success-soft text-success',
    Icon: CheckCircle2,
  },
  info: {
    wrap: 'border-info/30 bg-info-soft text-info',
    Icon: Info,
  },
} as const

export function Alert({
  children,
  tone = 'error',
}: {
  children: ReactNode
  tone?: 'error' | 'success' | 'info'
}) {
  const { wrap, Icon } = alertTones[tone]
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${wrap}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Search box
   -------------------------------------------------------------------------- */
export function SearchBox({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input
        className="input pl-10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

/* --------------------------------------------------------------------------
   Modal
   -------------------------------------------------------------------------- */
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div
      className="backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4 backdrop-blur-md"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-enter card max-h-[92vh] w-full overflow-auto p-5 ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-fg">{title}</h2>
          <button
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-card-hover hover:text-fg"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Empty state
   -------------------------------------------------------------------------- */
export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-card-2 text-faint">
        <Search className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-fg">{title}</h3>
      <p className="mt-1 text-sm text-muted">{message}</p>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Money
   -------------------------------------------------------------------------- */
export function Money({ value }: { value: string | number }) {
  return (
    <>
      {new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 2,
      }).format(Number(value))}
    </>
  )
}

/* --------------------------------------------------------------------------
   CountUp — animated number with reduced-motion fallback
   -------------------------------------------------------------------------- */
export function CountUp({
  value,
  duration = 1100,
  format = (n: number) => n.toLocaleString('en-PK'),
}: {
  value: number
  duration?: number
  format?: (n: number) => string
}) {
  const [display, setDisplay] = useState(0)
  const previous = useRef(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || duration <= 0) {
      setDisplay(value)
      previous.current = value
      return
    }

    const from = previous.current || 0
    const to = value
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick)
      } else {
        previous.current = to
      }
    }

    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [value, duration])

  return <>{format(display)}</>
}

/* --------------------------------------------------------------------------
   Stat card — clean KPI, icon accent top-left, value large below
   -------------------------------------------------------------------------- */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  format,
  hint,
}: {
  label: string
  value: number
  icon: ComponentType<{ className?: string }>
  tone?: 'brand' | 'accent' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue'
  format?: (n: number) => string
  hint?: ReactNode
}) {
  // All tones map to the single accent — chartreuse — so it stays consistent.
  // We keep the tone prop to avoid breaking callsites.
  void tone
  return (
    <div className="card lift group flex flex-col gap-4 p-6">
      {/* Icon — small, subtle, top-left */}
      <div className="h-8 w-8 grid place-items-center rounded-lg bg-accent-soft transition-colors group-hover:bg-brand-500/20">
        <Icon className="h-4 w-4 text-accent" />
      </div>

      {/* Metric */}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-faint">{label}</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-fg">
          <CountUp value={value} format={format} />
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-faint">{hint}</p>
        ) : null}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Theme toggle
   -------------------------------------------------------------------------- */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-border bg-card-2 text-muted transition hover:text-fg hover:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${className}`}
    >
      <Sun
        className={`absolute h-5 w-5 transition-all duration-500 ${
          isDark
            ? 'translate-y-8 rotate-90 opacity-0'
            : 'translate-y-0 rotate-0 opacity-100'
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-500 ${
          isDark
            ? 'translate-y-0 rotate-0 opacity-100'
            : '-translate-y-8 -rotate-90 opacity-0'
        }`}
      />
    </button>
  )
}
