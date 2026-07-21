import { zodResolver } from '@hookform/resolvers/zod'
import {
  BarChart3,
  Boxes,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Store,
  Sun,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { z } from 'zod'

import { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/ui'
import { useTheme } from '../theme/useTheme'

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
})

type Form = z.infer<typeof loginSchema>

const systemFeatures = [
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description:
      'Secure permissions for administrators, managers, and cashiers.',
  },
  {
    icon: Boxes,
    title: 'Real-time inventory',
    description:
      'Stock levels update automatically after every sale and purchase.',
  },
  {
    icon: BarChart3,
    title: 'Decision-ready analytics',
    description: 'Live KPIs, low-stock alerts, and profitability reports.',
  },
]

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  if (user) {
    return <Navigate to="/" replace />
  }

  const submit = handleSubmit(async (values) => {
    setError('')
    try {
      await login(values.username, values.password)
      const destination = (location.state as { from?: string } | null)?.from
      navigate(destination ?? '/', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    }
  })

  return (
    <main
      className="login-shell relative isolate flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-8"
      aria-labelledby="login-heading"
    >
      <div className="login-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="login-orb login-orb-one pointer-events-none absolute rounded-full" aria-hidden="true" />
      <div className="login-orb login-orb-two pointer-events-none absolute rounded-full" aria-hidden="true" />

      {/* Theme toggle floating in corner */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        className="absolute right-5 top-5 z-20 grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-fg shadow-sm transition hover:bg-card-2"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      <section
        className="login-card login-card-enter relative z-10 grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card text-fg shadow-2xl md:grid-cols-[1fr_1fr]"
        aria-label="POS and inventory staff portal"
      >
        <div className="login-brand-panel relative flex flex-col justify-between bg-card-2 p-8 text-fg sm:p-10 border-b md:border-b-0 md:border-r border-border">
          <div>
            <div className="flex items-center gap-3">
              <div className="login-logo grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-inverse shadow-sm">
                <Store className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-base font-bold tracking-tight text-fg">
                  POS &amp; Inventory
                </p>
                <p className="text-xs text-muted">
                  Management System
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl text-fg">
                Operate efficiently.<br />
                <span className="text-brand-500">Decide confidently.</span>
              </h2>

              <p className="mt-3 text-xs leading-relaxed text-muted max-w-xs">
                Single integrated portal for cashier operations, real-time inventory tracking, and decision support.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/60">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">System Capabilities</p>
            <div className="flex items-center gap-3">
              {systemFeatures.map(({ icon: Icon, title }) => (
                <div 
                  key={title} 
                  title={title}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-card border border-border text-brand-500 hover:border-brand-500/50 transition-colors"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="login-form-panel flex items-center bg-card p-8 sm:p-10">
          <div className="mx-auto w-full max-w-sm">
            <div>
              <h1
                id="login-heading"
                className="text-2xl font-bold tracking-tight text-fg"
              >
                Sign In
              </h1>
              <p className="mt-1 text-xs text-muted">
                Enter your credentials to access your account.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={submit} noValidate>
              {error ? (
                <div role="alert" aria-live="polite" className="login-alert">
                  <Alert>{error}</Alert>
                </div>
              ) : null}

              <div>
                <label className="label" htmlFor="username">
                  Username
                </label>
                <div className="group relative">
                  <UserRound
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-brand-500"
                    aria-hidden="true"
                  />
                  <input
                    id="username"
                    className="input min-h-11 pl-10 pr-4"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    aria-invalid={errors.username ? 'true' : 'false'}
                    aria-describedby={
                      errors.username ? 'username-error' : undefined
                    }
                    placeholder="Username"
                    {...register('username')}
                  />
                </div>
                {errors.username ? (
                  <p
                    id="username-error"
                    className="mt-1 text-xs font-medium text-danger"
                    role="alert"
                  >
                    {errors.username.message}
                  </p>
                ) : null}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="label" htmlFor="password">
                    Password
                  </label>
                </div>
                <div className="group relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-brand-500"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type={visible ? 'text' : 'password'}
                    className="input min-h-11 pl-10 pr-10"
                    autoComplete="current-password"
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={
                      errors.password ? 'password-error' : undefined
                    }
                    placeholder="Password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                    className="absolute right-1 top-1/2 grid min-h-9 min-w-9 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-card-2 hover:text-fg"
                    onClick={() => setVisible((current) => !current)}
                  >
                    {visible ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <p
                    id="password-error"
                    className="mt-1 text-xs font-medium text-danger"
                    role="alert"
                  >
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <button
                className="btn-primary relative min-h-11 w-full mt-2"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 spin-soft" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
