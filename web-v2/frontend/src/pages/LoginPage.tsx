import { zodResolver } from '@hookform/resolvers/zod'
import {
  BarChart3,
  Boxes,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Store,
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

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Enter your username'),
  password: z
    .string()
    .min(1, 'Enter your password'),
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
    description:
      'Live KPIs, low-stock alerts, and profitability reports.',
  },
]

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<Form>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  if (user) {
    return <Navigate to="/" replace />
  }

  const submit = handleSubmit(async (values) => {
    setError('')

    try {
      await login(values.username, values.password)

      const destination = (
        location.state as { from?: string } | null
      )?.from

      navigate(destination ?? '/', {
        replace: true,
      })
    } catch (err) {
      setError(errorMessage(err))
    }
  })

  return (
    <main
      className="login-shell relative isolate flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-8"
      aria-labelledby="login-heading"
    >
      <div
        className="login-grid pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      <div
        className="login-orb login-orb-one pointer-events-none absolute rounded-full"
        aria-hidden="true"
      />

      <div
        className="login-orb login-orb-two pointer-events-none absolute rounded-full"
        aria-hidden="true"
      />

      <section
        className="login-card login-card-enter relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-white md:min-h-[620px] md:grid-cols-[1.05fr_0.95fr]"
        aria-label="POS and inventory staff portal"
      >
        <div className="login-brand-panel relative overflow-hidden bg-slate-950 p-7 text-white sm:p-10">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.24),transparent_33%),radial-gradient(circle_at_90%_90%,rgba(59,130,246,0.18),transparent_40%)]"
            aria-hidden="true"
          />

          <div className="login-brand-enter relative z-10 flex h-full flex-col">
            <div>
              <div className="flex items-center gap-4">
                <div className="login-logo grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-950/30">
                  <Store
                    className="h-7 w-7"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-lg font-bold tracking-tight">
                    POS &amp; Inventory
                  </p>

                  <p className="text-sm text-slate-400">
                    Management Information System
                  </p>
                </div>
              </div>

              <div className="mt-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  <ShieldCheck
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Secure staff portal
                </div>

                <h2 className="mt-5 max-w-md text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  Operate efficiently.
                  <span className="block text-brand-500">
                    Decide confidently.
                  </span>
                </h2>

                <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
                  One integrated workspace for daily transactions,
                  inventory control, and managerial decision support.
                </p>
              </div>
            </div>

            <div className="mt-9 hidden gap-5 sm:grid">
              {systemFeatures.map(
                ({
                  icon: Icon,
                  title,
                  description,
                }) => (
                  <div
                    className="login-feature flex gap-3"
                    key={title}
                  >
                    <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-500">
                      <Icon
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {title}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {description}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>

            <p className="mt-auto hidden pt-8 text-xs text-slate-500 sm:block">
              TPS operations • Inventory control • DSS analytics
            </p>
          </div>
        </div>

        <div className="login-form-panel flex items-center bg-white p-7 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <div>
              <p className="text-sm font-semibold text-brand-700">
                Authorized access
              </p>

              <h1
                id="login-heading"
                className="mt-2 text-3xl font-bold tracking-tight text-slate-950"
              >
                Welcome back
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your staff credentials to access the management system.
              </p>
            </div>

            <form
              className="mt-8 space-y-5"
              onSubmit={submit}
              noValidate
            >
              {error ? (
                <div
                  role="alert"
                  aria-live="polite"
                  className="login-alert"
                >
                  <Alert>{error}</Alert>
                </div>
              ) : null}

              <div>
                <label
                  className="label"
                  htmlFor="username"
                >
                  Username
                </label>

                <div className="group relative">
                  <UserRound
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-700"
                    aria-hidden="true"
                  />

                  <input
                    id="username"
                    className="input min-h-12 pl-11 pr-4"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    aria-invalid={
                      errors.username ? 'true' : 'false'
                    }
                    aria-describedby={
                      errors.username
                        ? 'username-error'
                        : undefined
                    }
                    placeholder="Enter your username"
                    {...register('username')}
                  />
                </div>

                {errors.username ? (
                  <p
                    id="username-error"
                    className="mt-1.5 text-xs font-medium text-red-600"
                    role="alert"
                  >
                    {errors.username.message}
                  </p>
                ) : null}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    className="text-sm font-semibold text-slate-700"
                    htmlFor="password"
                  >
                    Password
                  </label>

                  <span className="text-xs text-slate-400">
                    Case-sensitive
                  </span>
                </div>

                <div className="group relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-700"
                    aria-hidden="true"
                  />

                  <input
                    id="password"
                    type={visible ? 'text' : 'password'}
                    className="input min-h-12 pl-11 pr-12"
                    autoComplete="current-password"
                    aria-invalid={
                      errors.password ? 'true' : 'false'
                    }
                    aria-describedby={
                      errors.password
                        ? 'password-error'
                        : undefined
                    }
                    placeholder="Enter your password"
                    {...register('password')}
                  />

                  <button
                    type="button"
                    aria-label={
                      visible
                        ? 'Hide password'
                        : 'Show password'
                    }
                    aria-pressed={visible}
                    className="absolute right-1 top-1/2 grid min-h-10 min-w-10 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1"
                    onClick={() =>
                      setVisible((current) => !current)
                    }
                  >
                    {visible ? (
                      <EyeOff
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>

                {errors.password ? (
                  <p
                    id="password-error"
                    className="mt-1.5 text-xs font-medium text-red-600"
                    role="alert"
                  >
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <button
                className="login-submit btn-primary relative min-h-12 w-full overflow-hidden"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LockKeyhole
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    Sign in securely
                  </>
                )}
              </button>

              <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                <ShieldCheck
                  className="h-4 w-4 text-emerald-600"
                  aria-hidden="true"
                />
                Your session is protected with secure authentication.
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}