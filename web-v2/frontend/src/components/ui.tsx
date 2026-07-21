import { LoaderCircle, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <div className="flex min-h-48 items-center justify-center gap-3 text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" /><span>{label}…</span></div>
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="page-title">{title}</h1>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{action}</div>
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' | 'info' }) {
  const colors = tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : tone === 'info' ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-red-200 bg-red-50 text-red-800'
  return <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${colors}`}>{children}</div>
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="relative block"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input className="input pl-9" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>
}

export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={onClose}>
    <section role="dialog" aria-modal="true" aria-label={title} className={`card max-h-[92vh] w-full overflow-auto p-5 ${wide ? 'max-w-3xl' : 'max-w-lg'}`} onMouseDown={(event) => event.stopPropagation()}>
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-950">{title}</h2><button aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onClose}><X className="h-5 w-5" /></button></div>
      {children}
    </section>
  </div>
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="py-14 text-center"><h3 className="font-semibold text-slate-800">{title}</h3><p className="mt-1 text-sm text-slate-500">{message}</p></div>
}

export function Money({ value }: { value: string | number }) {
  return <>{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(Number(value))}</>
}
