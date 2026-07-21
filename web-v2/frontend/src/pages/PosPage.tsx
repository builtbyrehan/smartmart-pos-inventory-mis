import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../api/client'
import { Alert, Money, PageHeader, SearchBox, Spinner } from '../components/ui'
import type { Customer, Product, Sale } from '../types'
import { saleEstimate } from '../utils/calculations'

export function PosPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [customerId, setCustomerId] = useState(0)
  const [cart, setCart] = useState<Record<number, number>>({})
  const [completed, setCompleted] = useState<Sale | null>(null)
  const products = useQuery({ queryKey: ['products', 'active'], queryFn: () => api.get<Product[]>('/products?active_only=true').then((r) => r.data) })
  const customers = useQuery({ queryKey: ['customers'], queryFn: () => api.get<Customer[]>('/customers').then((r) => r.data) })
  const visible = (products.data ?? []).filter((p) => `${p.name} ${p.barcode}`.toLowerCase().includes(search.toLowerCase()))
  const lines = useMemo(() => Object.entries(cart).map(([id, quantity]) => ({ product: products.data?.find((p) => p.id === Number(id)), quantity })).filter((line): line is { product: Product; quantity: number } => Boolean(line.product)), [cart, products.data])
  const total = saleEstimate(lines.map((line) => ({ price: line.product.selling_price, quantity: line.quantity })))
  const checkout = useMutation({ mutationFn: () => api.post<Sale>('/sales', { customer_id: customerId, items: lines.map((line) => ({ product_id: line.product.id, quantity: line.quantity })) }).then((r) => r.data), onSuccess: (sale) => { setCompleted(sale); setCart({}); qc.invalidateQueries({ queryKey: ['products'] }) } })
  const setQuantity = (product: Product, quantity: number) => setCart((current) => { const next = { ...current }; if (quantity <= 0) delete next[product.id]; else next[product.id] = Math.min(quantity, product.stock_quantity); return next })
  if (products.isLoading || customers.isLoading) return <Spinner label="Preparing checkout" />
  return <><PageHeader title="Point of Sale" subtitle="Search products, build the cart, and complete a stock-safe sale." />
    {completed && <div className="mb-5"><Alert tone="success">Sale completed as <strong>{completed.invoice_number}</strong>. <Link className="underline" to={`/sales/${completed.id}`}>Open invoice</Link></Alert></div>}
    {checkout.isError && <div className="mb-5"><Alert>{errorMessage(checkout.error)}</Alert></div>}
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]"><section className="space-y-4"><SearchBox value={search} onChange={setSearch} placeholder="Search product name or scan barcode…" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visible.map((product) => <button key={product.id} disabled={product.stock_quantity <= 0} onClick={() => setQuantity(product, (cart[product.id] ?? 0) + 1)} className="card p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-500 disabled:opacity-50"><div className="flex items-start justify-between gap-2"><p className="font-semibold text-slate-900">{product.name}</p><span className={`badge ${product.stock_quantity <= product.reorder_level ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{product.stock_quantity} in stock</span></div><p className="mt-1 text-xs text-slate-400">{product.barcode}</p><p className="mt-4 text-lg font-bold text-brand-800"><Money value={product.selling_price} /></p></button>)}</div></section>
      <aside className="card h-fit overflow-hidden xl:sticky xl:top-24"><div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4"><ShoppingBag className="text-brand-700" /><h2 className="font-bold">Current cart</h2><span className="badge ml-auto bg-slate-100 text-slate-700">{lines.length} items</span></div><div className="max-h-[430px] divide-y divide-slate-100 overflow-y-auto">{lines.length ? lines.map(({ product, quantity }) => <div key={product.id} className="p-4"><div className="flex justify-between gap-3"><div><p className="font-medium text-slate-800">{product.name}</p><p className="text-sm text-slate-500"><Money value={Number(product.selling_price) * quantity} /></p></div><button aria-label={`Remove ${product.name}`} className="text-slate-400 hover:text-red-600" onClick={() => setQuantity(product, 0)}><Trash2 className="h-4 w-4" /></button></div><div className="mt-3 flex items-center gap-2"><button className="rounded-lg border p-1.5" onClick={() => setQuantity(product, quantity - 1)}><Minus className="h-4 w-4" /></button><span className="w-8 text-center font-semibold">{quantity}</span><button className="rounded-lg border p-1.5" onClick={() => setQuantity(product, quantity + 1)}><Plus className="h-4 w-4" /></button></div></div>) : <div className="p-10 text-center text-sm text-slate-400">Select a product to begin.</div>}</div><div className="space-y-4 border-t border-slate-200 p-5"><div><label className="label" htmlFor="customer">Customer</label><select id="customer" className="input" value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}><option value={0}>Choose customer…</option>{customers.data?.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}</select></div><div className="flex items-center justify-between text-lg"><span className="font-semibold">Total</span><strong className="text-brand-800"><Money value={total} /></strong></div><button className="btn-primary w-full" disabled={!customerId || !lines.length || checkout.isPending} onClick={() => checkout.mutate()}>{checkout.isPending ? 'Completing…' : 'Complete sale'}</button><p className="text-xs leading-5 text-slate-400">Final prices, totals, and stock are validated again by the server.</p></div></aside></div>
  </>
}
