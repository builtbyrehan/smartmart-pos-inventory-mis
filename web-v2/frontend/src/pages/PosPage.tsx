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

  const products = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () =>
      api.get<Product[]>('/products?active_only=true').then((r) => r.data),
  })
  const customers = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<Customer[]>('/customers').then((r) => r.data),
  })

  const visible = (products.data ?? []).filter((p) =>
    `${p.name} ${p.barcode}`.toLowerCase().includes(search.toLowerCase()),
  )

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => ({
          product: products.data?.find((p) => p.id === Number(id)),
          quantity,
        }))
        .filter(
          (line): line is { product: Product; quantity: number } =>
            Boolean(line.product),
        ),
    [cart, products.data],
  )

  const total = saleEstimate(
    lines.map((line) => ({
      price: line.product.selling_price,
      quantity: line.quantity,
    })),
  )

  const checkout = useMutation({
    mutationFn: () =>
      api
        .post<Sale>('/sales', {
          customer_id: customerId,
          items: lines.map((line) => ({
            product_id: line.product.id,
            quantity: line.quantity,
          })),
        })
        .then((r) => r.data),
    onSuccess: (sale) => {
      setCompleted(sale)
      setCart({})
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const setQuantity = (product: Product, quantity: number) =>
    setCart((current) => {
      const next = { ...current }
      if (quantity <= 0) delete next[product.id]
      else next[product.id] = Math.min(quantity, product.stock_quantity)
      return next
    })

  if (products.isLoading || customers.isLoading)
    return <Spinner label="Preparing checkout" />

  return (
    <>
      <PageHeader
        title="Point of Sale"
        subtitle="Search products, build the cart, and complete a stock-safe sale."
      />

      {completed ? (
        <div className="mb-5">
          <Alert tone="success">
            Sale completed as <strong>{completed.invoice_number}</strong>.{' '}
            <Link className="underline" to={`/sales/${completed.id}`}>
              Open invoice
            </Link>
          </Alert>
        </div>
      ) : null}
      {checkout.isError ? (
        <div className="mb-5">
          <Alert>{errorMessage(checkout.error)}</Alert>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-4">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search product name or scan barcode…"
          />

          <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((product) => (
              <button
                key={product.id}
                disabled={product.stock_quantity <= 0}
                onClick={() =>
                  setQuantity(product, (cart[product.id] ?? 0) + 1)
                }
                className="card lift group p-4 text-left transition hover:border-brand-400/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-fg">{product.name}</p>
                  <span
                    className={`badge ${
                      product.stock_quantity <= product.reorder_level
                        ? 'badge-warning'
                        : 'badge-success'
                    }`}
                  >
                    {product.stock_quantity} in stock
                  </span>
                </div>
                <p className="mt-1 text-xs text-faint">{product.barcode}</p>
                <p className="mt-4 text-lg font-bold text-gradient">
                  <Money value={product.selling_price} />
                </p>
              </button>
            ))}
          </div>
        </section>

        <aside className="card h-fit overflow-hidden xl:sticky xl:top-24">
          <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-brand-500/15 to-accent/15 px-5 py-4">
            <div className="icon-chip h-9 w-9 bg-accent-soft text-brand-300">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <h2 className="font-bold text-fg">Current cart</h2>
            <span className="badge badge-neutral ml-auto">
              {lines.length} items
            </span>
          </div>

          <div className="max-h-[430px] divide-y divide-border-soft overflow-y-auto">
            {lines.length ? (
              lines.map(({ product, quantity }) => (
                <div key={product.id} className="p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-medium text-fg">{product.name}</p>
                      <p className="text-sm text-muted">
                        <Money
                          value={Number(product.selling_price) * quantity}
                        />
                      </p>
                    </div>
                    <button
                      aria-label={`Remove ${product.name}`}
                      className="text-faint transition hover:text-danger"
                      onClick={() => setQuantity(product, 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card-2 text-muted transition hover:text-fg"
                      onClick={() => setQuantity(product, quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-semibold text-fg">
                      {quantity}
                    </span>
                    <button
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card-2 text-muted transition hover:text-fg"
                      onClick={() => setQuantity(product, quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-sm text-faint">
                Select a product to begin.
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-border p-5">
            <div>
              <label className="label" htmlFor="customer">
                Customer
              </label>
              <select
                id="customer"
                className="input"
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
              >
                <option value={0}>Choose customer…</option>
                {customers.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold text-fg">Total</span>
              <strong className="text-gradient">
                <Money value={total} />
              </strong>
            </div>

            <button
              className="btn-primary w-full"
              disabled={!customerId || !lines.length || checkout.isPending}
              onClick={() => checkout.mutate()}
            >
              {checkout.isPending ? 'Completing…' : 'Complete sale'}
            </button>

            <p className="text-xs leading-5 text-faint">
              Final prices, totals, and stock are validated again by the server.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
