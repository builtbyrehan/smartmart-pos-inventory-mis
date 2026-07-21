import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '../api/client'
import { DataTable, type Column } from '../components/DataTable'
import { Alert, Modal, Money, PageHeader, SearchBox, Spinner } from '../components/ui'
import { useAuth } from '../auth/AuthContext'
import type { Category, Product, Supplier } from '../types'

type Form = { name: string; category_id: number; supplier_id: number; barcode: string; purchase_price: number; selling_price: number; stock_quantity: number; reorder_level: number; is_active: boolean }
const blank: Form = { name: '', category_id: 0, supplier_id: 0, barcode: '', purchase_price: 0, selling_price: 0, stock_quantity: 0, reorder_level: 10, is_active: true }

export function ProductsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [form, setForm] = useState<Form>(blank)
  const canWrite = user?.role === 'Admin' || user?.role === 'Inventory Officer'
  const products = useQuery({ queryKey: ['products'], queryFn: () => api.get<Product[]>('/products').then((r) => r.data) })
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/categories').then((r) => r.data) })
  const suppliers = useQuery({ queryKey: ['suppliers', 'products'], queryFn: () => api.get<Supplier[]>('/suppliers').then((r) => r.data), enabled: canWrite })
  const save = useMutation({ mutationFn: () => editing === 'new' ? api.post('/products', form) : api.put(`/products/${editing!.id}`, form), onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setEditing(null) } })
  const open = (row: Product | 'new') => { setEditing(row); setForm(row === 'new' ? blank : { name: row.name, category_id: row.category_id, supplier_id: row.supplier_id, barcode: row.barcode, purchase_price: Number(row.purchase_price), selling_price: Number(row.selling_price), stock_quantity: row.stock_quantity, reorder_level: row.reorder_level, is_active: row.is_active }) }
  if (products.isLoading || categories.isLoading) return <Spinner label="Loading products" />
  const rows = (products.data ?? []).filter((p) => `${p.name} ${p.barcode} ${p.category_name} ${p.supplier_name}`.toLowerCase().includes(search.toLowerCase()))
  const columns: Column<Product>[] = [
    { key: 'name', header: 'Product', render: (p) => <div><strong className="text-slate-900">{p.name}</strong><p className="text-xs text-slate-400">{p.barcode}</p></div> },
    { key: 'category', header: 'Category', render: (p) => p.category_name }, { key: 'supplier', header: 'Supplier', render: (p) => p.supplier_name },
    { key: 'prices', header: 'Prices', render: (p) => <div><Money value={p.selling_price} /><p className="text-xs text-slate-400">Cost: <Money value={p.purchase_price} /></p></div> },
    { key: 'stock', header: 'Stock', render: (p) => <span className={`badge ${p.stock_quantity <= p.reorder_level ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{p.stock_quantity}</span> },
    { key: 'status', header: 'Status', render: (p) => <span className={`badge ${p.is_active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{p.is_active ? 'Active' : 'Inactive'}</span> },
    ...(canWrite ? [{ key: 'edit', header: '', render: (p: Product) => <button className="btn-secondary" onClick={() => open(p)}><Pencil className="h-4 w-4" /> Edit</button> }] : []),
  ]
  const field = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }))
  return <><PageHeader title="Products" subtitle="Manage the inventory catalog, prices, and reorder levels." action={canWrite && <button className="btn-primary" onClick={() => open('new')}><Plus className="h-4 w-4" /> Add product</button>} /><div className="card mb-4 p-4"><SearchBox value={search} onChange={setSearch} placeholder="Search name, barcode, category, or supplier…" /></div><section className="card overflow-hidden"><DataTable rows={rows} columns={columns} /></section>
    {editing && <Modal title={editing === 'new' ? 'Add product' : 'Edit product'} onClose={() => setEditing(null)} wide><form className="grid gap-4 sm:grid-cols-2" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate() }}>{save.isError && <div className="sm:col-span-2"><Alert>{errorMessage(save.error)}</Alert></div>}<div className="sm:col-span-2"><label className="label">Product name</label><input className="input" required value={form.name} onChange={(e) => field('name', e.target.value)} /></div><div><label className="label">Category</label><select className="input" required value={form.category_id} onChange={(e) => field('category_id', Number(e.target.value))}><option value={0}>Choose…</option>{categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label className="label">Supplier</label><select className="input" required value={form.supplier_id} onChange={(e) => field('supplier_id', Number(e.target.value))}><option value={0}>Choose…</option>{suppliers.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><label className="label">Barcode</label><input className="input" required value={form.barcode} onChange={(e) => field('barcode', e.target.value)} /></div>{(['purchase_price', 'selling_price', 'stock_quantity', 'reorder_level'] as const).map((key) => <div key={key}><label className="label">{key.split('_').map((x) => x[0].toUpperCase() + x.slice(1)).join(' ')}</label><input className="input" type="number" min="0" step={key.includes('price') ? '.01' : '1'} value={form[key]} onChange={(e) => field(key, Number(e.target.value))} /></div>)}{editing !== 'new' && <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold"><input type="checkbox" checked={form.is_active} onChange={(e) => field('is_active', e.target.checked)} /> Active</label>}<div className="flex justify-end gap-3 sm:col-span-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save product'}</button></div></form></Modal>}
  </>
}
