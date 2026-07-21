import { useLocation } from 'react-router-dom'

/**
 * Wraps page content with the `.page-enter` animation, re-keyed to the
 * current pathname so each route transition re-triggers the entrance.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  )
}
