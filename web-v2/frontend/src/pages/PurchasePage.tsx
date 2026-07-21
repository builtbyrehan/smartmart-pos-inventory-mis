import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PackagePlus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../api/client'
import { Alert, Money, PageHeader, Spinner } from '../components/ui'
import type { Product, Purchase, Supplier } from '../types'
import { purchaseEstimate } from '../utils/calculations'

type Line = { product_id: number; quantity: number; purchase_price: number }
export function PurchasePage() {
  const qc = useQueryClient()
  const [supplierId, setSupplierId] = useState(0)
  const [lines, setLines] = useState<Line[]>([])
  const [done, setDone] = useState<Purchase | null>(null)
  const suppliers = useQuery({ queryKey: ['suppliers'], queryFn: () => api.get<Supplier[]>('/suppliers').then((r) => r.data) })
  const products = useQuery({ queryKey: ['products', supplierId], queryFn: () => api.get<Product[]>(`/products?active_only=true&supplier_id=${supplierId}`).then((r) => r.data), enabled: supplierId > 0 })
  const total = useMemo(() => purchaseEstimate(lines), [lines])
  const save = useMutation({ mutationFn: () => api.post<Purchase>('/purchases', { supplier_id: supplierId, items: lines }).then((r) => r.data), onSuccess: (result) => { setDone(result); setLines([]); qc.invalidateQueries({ queryKey: ['products'] }) } })
  const add = (product: Product) => setLines((current) => current.some((line) => line.product_id === product.id) ? current : [...current, { product_id: product.id, quantity: 1, purchase_price: Number(product.purchase_price) }])
  const update = (id: number, patch: Partial<Line>) => setLines((current) => current.map((line) => line.product_id === id ? { ...line, ...patch } : line))
  if (suppliers.isLoading) return <Spinner label="Preparing purchase entry" />
  return <><PageHeader title="New Purchase" subtitle="Receive supplier stock with backend-calculated totals and an atomic inventory update." />
    {done && <div className="mb-5"><Alert tone="success">Purchase saved as <strong>{done.invoice_number}</strong>. <Link className="underline" to={`/purchases/${done.id}`}>Open invoice</Link></Alert></div>}
    {save.isError && <div className="mb-5"><Alert>{errorMessage(save.error)}</Alert></div>}
    <div className="card p-5"><div className="grid gap-4 md:grid-cols-2"><div><label className="label">Supplier</label><select className="input" value={supplierId} onChange={(e) => { setSupplierId(Number(e.target.value)); setLines([]) }}><option value={0}>Choose supplier…</option>{suppliers.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><label className="label">Add product</label><select className="input" value="" disabled={!supplierId || products.isLoading} onChange={(e) => { const product = products.data?.find((p) => p.id === Number(e.target.value)); if (product) add(product) }}><option value="">{supplierId ? 'Select a product…' : 'Choose a supplier first'}</option>{products.data?.map((p) => <option key={p.id} value={p.id}>{p.name} · stock {p.stock_quantity}</option>)}</select></div></div></div>
    <section className="card mt-6 overflow-hidden"><div className="border-b border-slate-200 px-5 py-4"><h2 className="flex items-center gap-2 font-bold"><PackagePlus className="h-5 w-5 text-brand-700" /> Purchase items</h2></div>{lines.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Product</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Unit cost</th><th className="px-5 py-3 text-right">Line total</th><th /></tr></thead><tbody className="divide-y divide-slate-100">{lines.map((line) => { const product = products.data?.find((p) => p.id === line.product_id); return <tr key={line.product_id}><td className="px-5 py-3 font-medium">{product?.name}</td><td className="px-5 py-3"><input aria-label="Quantity" className="input w-28" type="number" min="1" value={line.quantity} onChange={(e) => update(line.product_id, { quantity: Math.max(1, Number(e.target.value)) })} /></td><td className="px-5 py-3"><input aria-label="Purchase price" className="input w-36" type="number" min="0.01" step="0.01" value={line.purchase_price} onChange={(e) => update(line.product_id, { purchase_price: Math.max(.01, Number(e.target.value)) })} /></td><td className="px-5 py-3 text-right font-semibold"><Money value={line.quantity * line.purchase_price} /></td><td className="px-5 py-3"><button className="text-slate-400 hover:text-red-600" onClick={() => setLines((current) => current.filter((item) => item.product_id !== line.product_id))}><Trash2 className="h-4 w-4" /></button></td></tr> })}</tbody></table></div> : <div className="p-12 text-center text-sm text-slate-400">No purchase items added.</div>}<div className="flex flex-col items-end gap-4 border-t border-slate-200 p-5"><p className="text-lg">Total: <strong className="text-brand-800"><Money value={total} /></strong></p><button className="btn-primary" disabled={!supplierId || !lines.length || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : 'Save purchase'}</button></div></section>
  </>
}
