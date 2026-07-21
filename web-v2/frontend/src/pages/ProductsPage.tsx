import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '../api/client'
import { DataTable, type Column } from '../components/DataTable'
import {
  Alert,
  Modal,
  Money,
  PageHeader,
  SearchBox,
  Spinner,
} from '../components/ui'
import { useAuth } from '../auth/AuthContext'
import type { Category, Product, Supplier } from '../types'

type Form = {
  name: string
  category_id: number
  supplier_id: number
  barcode: string
  purchase_price: number
  selling_price: number
  stock_quantity: number
  reorder_level: number
  is_active: boolean
}
const blank: Form = {
  name: '',
  category_id: 0,
  supplier_id: 0,
  barcode: '',
  purchase_price: 0,
  selling_price: 0,
  stock_quantity: 0,
  reorder_level: 10,
  is_active: true,
}

export function ProductsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [form, setForm] = useState<Form>(blank)

  const canWrite =
    user?.role === 'Admin' || user?.role === 'Inventory Officer'

  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<Product[]>('/products').then((r) => r.data),
  })
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories').then((r) => r.data),
  })
  const suppliers = useQuery({
    queryKey: ['suppliers', 'products'],
    queryFn: () => api.get<Supplier[]>('/suppliers').then((r) => r.data),
    enabled: canWrite,
  })

  const save = useMutation({
    mutationFn: () =>
      editing === 'new'
        ? api.post('/products', form)
        : api.put(`/products/${editing!.id}`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setEditing(null)
    },
  })

  const open = (row: Product | 'new') => {
    setEditing(row)
    setForm(
      row === 'new'
        ? blank
        : {
            name: row.name,
            category_id: row.category_id,
            supplier_id: row.supplier_id,
            barcode: row.barcode,
            purchase_price: Number(row.purchase_price),
            selling_price: Number(row.selling_price),
            stock_quantity: row.stock_quantity,
            reorder_level: row.reorder_level,
            is_active: row.is_active,
          },
    )
  }

  if (products.isLoading || categories.isLoading)
    return <Spinner label="Loading products" />

  const rows = (products.data ?? []).filter((p) =>
    `${p.name} ${p.barcode} ${p.category_name} ${p.supplier_name}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-400 font-semibold text-xs border border-brand-500/20">
            {p.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong className="text-fg font-semibold">{p.name}</strong>
            <p className="font-mono text-xs text-faint tracking-wider">{p.barcode}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => <span className="badge badge-neutral">{p.category_name}</span> },
    { key: 'supplier', header: 'Supplier', render: (p) => <span className="text-muted text-sm">{p.supplier_name}</span> },
    {
      key: 'prices',
      header: 'Prices & Profit',
      render: (p) => {
        const margin = Number(p.selling_price) - Number(p.purchase_price)
        return (
          <div>
            <div className="font-medium text-fg">
              <Money value={p.selling_price} />
            </div>
            <div className="flex items-center gap-2 text-xs text-faint">
              <span>Cost: <Money value={p.purchase_price} /></span>
              {margin > 0 ? (
                <span className="text-emerald-400 font-medium">+<Money value={margin} /></span>
              ) : null}
            </div>
          </div>
        )
      },
    },
    {
      key: 'stock',
      header: 'Stock Level',
      render: (p) => {
        const isLow = p.stock_quantity <= p.reorder_level
        const pct = Math.min(100, Math.max(10, (p.stock_quantity / Math.max(p.reorder_level * 2, 1)) * 100))
        return (
          <div className="min-w-36">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className={isLow ? 'text-amber-400' : 'text-emerald-400'}>
                {p.stock_quantity} units
              </span>
              <span className="text-faint text-[11px]">Reorder: {p.reorder_level}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border-soft">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isLow ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-emerald-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <span
          className={`badge ${p.is_active ? 'badge-info' : 'badge-neutral'}`}
        >
          {p.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    ...(canWrite
      ? [
          {
            key: 'edit',
            header: '',
            className: 'text-right',
            render: (p: Product) => (
              <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => open(p)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            ),
          },
        ]
      : []),
  ]

  const field = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  return (
    <>
      <PageHeader
        title="Product Catalog"
        subtitle="Manage inventory items, barcodes, dynamic pricing, and stock triggers."
        icon={Plus}
        action={
          canWrite ? (
            <button className="btn-primary shadow-glow-brand" onClick={() => open('new')}>
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          ) : null
        }
      />

      <div className="card mb-6 p-4">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Filter catalog by product title, barcode, category name, or supplier…"
        />
      </div>

      <section className="card overflow-hidden">
        <DataTable rows={rows} columns={columns} />
      </section>

      {editing ? (
        <Modal
          title={editing === 'new' ? 'New Inventory Item' : 'Edit Product Specifications'}
          onClose={() => setEditing(null)}
          wide
        >
          <form
            className="space-y-6"
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              save.mutate()
            }}
          >
            {save.isError ? (
              <Alert>{errorMessage(save.error)}</Alert>
            ) : null}

            {/* General Identity Section */}
            <div className="rounded-2xl border border-border-soft bg-card-2/50 p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">1. Product Identity</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Product Name</label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. Wireless Ergonomic Mouse"
                    value={form.name}
                    onChange={(e) => field('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    required
                    value={form.category_id}
                    onChange={(e) => field('category_id', Number(e.target.value))}
                  >
                    <option value={0}>Select Category…</option>
                    {categories.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Supplier</label>
                  <select
                    className="input"
                    required
                    value={form.supplier_id}
                    onChange={(e) => field('supplier_id', Number(e.target.value))}
                  >
                    <option value={0}>Select Supplier…</option>
                    {suppliers.data?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Barcode / SKU</label>
                  <input
                    className="input font-mono"
                    required
                    placeholder="e.g. 890123456789"
                    value={form.barcode}
                    onChange={(e) => field('barcode', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Stock Section */}
            <div className="rounded-2xl border border-border-soft bg-card-2/50 p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">2. Pricing & Stock Thresholds</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Purchase Cost (PKR)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step=".01"
                    value={form.purchase_price}
                    onChange={(e) => field('purchase_price', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">Selling Price (PKR)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step=".01"
                    value={form.selling_price}
                    onChange={(e) => field('selling_price', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">Current Stock Quantity</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock_quantity}
                    onChange={(e) => field('stock_quantity', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">Reorder Level Threshold</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.reorder_level}
                    onChange={(e) => field('reorder_level', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {editing !== 'new' ? (
              <div className="flex items-center justify-between px-2">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-fg">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-brand-500"
                    checked={form.is_active}
                    onChange={(e) => field('is_active', e.target.checked)}
                  />
                  Item Active in POS Catalog
                </label>
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="btn-primary" disabled={save.isPending}>
                {save.isPending ? 'Saving Item…' : 'Save Item'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  )
}
