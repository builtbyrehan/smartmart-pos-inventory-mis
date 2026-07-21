import { Link } from 'react-router-dom'

export function UnauthorizedPage() {
  return (
    <div className="relative grid min-h-[70vh] place-items-center overflow-hidden p-4">
      <div className="app-orb app-orb-one opacity-40" aria-hidden="true" />
      <div className="app-orb app-orb-two opacity-40" aria-hidden="true" />
      <div className="card relative z-10 mx-auto max-w-xl p-10 text-center">
        <p className="text-gradient text-7xl font-black">403</p>
        <h1 className="mt-4 text-2xl font-bold text-fg">Access not available</h1>
        <p className="mt-2 text-muted">
          Your account role does not include this area.
        </p>
        <Link className="btn-primary mt-6" to="/">
          Return home
        </Link>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-bg-soft p-4">
      <div className="app-orb app-orb-one" aria-hidden="true" />
      <div className="app-orb app-orb-two" aria-hidden="true" />
      <div className="app-orb app-orb-three" aria-hidden="true" />
      <div className="relative z-10 text-center">
        <p className="text-gradient text-8xl font-black">404</p>
        <h1 className="mt-4 text-2xl font-bold text-fg">Page not found</h1>
        <p className="mt-2 text-muted">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link className="btn-primary mt-6" to="/">
          Go to dashboard
        </Link>
      </div>
    </main>
  )
}
