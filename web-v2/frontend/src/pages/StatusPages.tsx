import { Link } from 'react-router-dom'

export function UnauthorizedPage() { return <div className="card mx-auto max-w-xl p-10 text-center"><p className="text-6xl font-black text-amber-500">403</p><h1 className="mt-4 text-2xl font-bold">Access not available</h1><p className="mt-2 text-slate-500">Your account role does not include this area.</p><Link className="btn-primary mt-6" to="/">Return home</Link></div> }
export function NotFoundPage() { return <main className="grid min-h-screen place-items-center bg-slate-50 p-4"><div className="text-center"><p className="text-7xl font-black text-brand-700">404</p><h1 className="mt-4 text-2xl font-bold">Page not found</h1><Link className="btn-primary mt-6" to="/">Go to dashboard</Link></div></main> }
