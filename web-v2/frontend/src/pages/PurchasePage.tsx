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

  const suppliers = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<Supplier[]>('/suppliers').then((r) => r.data),
  })
  const products = useQuery({
    queryKey: ['products', supplierId],
    queryFn: () =>
      api
        .get<Product[]>(`/products?active_only=true&supplier_id=${supplierId}`)
        .then((r) => r.data),
    enabled: supplierId > 0,
  })

  const total = useMemo(() => purchaseEstimate(lines), [lines])

  const save = useMutation({
    mutationFn: () =>
      api
        .post<Purchase>('/purchases', {
          supplier_id: supplierId,
          items: lines,
        })
        .then((r) => r.data),
    onSuccess: (result) => {
      setDone(result)
      setLines([])
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const add = (product: Product) =>
    setLines((current) =>
      current.some((line) => line.product_id === product.id)
        ? current
        : [
            ...current,
            {
              product_id: product.id,
              quantity: 1,
              purchase_price: Number(product.purchase_price),
            },
          ],
    )

  const update = (id: number, patch: Partial<Line>) =>
    setLines((current) =>
      current.map((line) =>
        line.product_id === id ? { ...line, ...patch } : line,
      ),
    )

  if (suppliers.isLoading) return <Spinner label="Preparing purchase entry" />

  return (
    <>
      <PageHeader
        title="New Purchase"
        subtitle="Receive supplier stock with backend-calculated totals and an atomic inventory update."
        icon={PackagePlus}
      />

      {done ? (
        <div className="mb-5">
          <Alert tone="success">
            Purchase saved as <strong>{done.invoice_number}</strong>.{' '}
            <Link className="underline" to={`/purchases/${done.id}`}>
              Open invoice
            </Link>
          </Alert>
        </div>
      ) : null}
      {save.isError ? (
        <div className="mb-5">
          <Alert>{errorMessage(save.error)}</Alert>
        </div>
      ) : null}

      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Supplier</label>
            <select
              className="input"
              value={supplierId}
              onChange={(e) => {
                setSupplierId(Number(e.target.value))
                setLines([])
              }}
            >
              <option value={0}>Choose supplier…</option>
              {suppliers.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Add product</label>
            <select
              className="input"
              value=""
              disabled={!supplierId || products.isLoading}
              onChange={(e) => {
                const product = products.data?.find(
                  (p) => p.id === Number(e.target.value),
                )
                if (product) add(product)
              }}
            >
              <option value="">
                {supplierId ? 'Select a product…' : 'Choose a supplier first'}
              </option>
              {products.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · stock {p.stock_quantity}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="icon-chip h-9 w-9 bg-accent-soft text-brand-300">
            <PackagePlus className="h-4 w-4" />
          </div>
          <h2 className="font-bold text-fg">Purchase items</h2>
        </div>

        {lines.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-card-2/60 text-left text-xs uppercase text-faint">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Quantity</th>
                  <th className="px-5 py-3.5">Unit cost</th>
                  <th className="px-5 py-3.5 text-right">Line total</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {lines.map((line) => {
                  const product = products.data?.find(
                    (p) => p.id === line.product_id,
                  )
                  return (
                    <tr key={line.product_id} className="hover:bg-accent/5">
                      <td className="px-5 py-3.5 font-medium text-fg">
                        {product?.name}
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          aria-label="Quantity"
                          className="input w-28"
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) =>
                            update(line.product_id, {
                              quantity: Math.max(1, Number(e.target.value)),
                            })
                          }
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          aria-label="Purchase price"
                          className="input w-36"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={line.purchase_price}
                          onChange={(e) =>
                            update(line.product_id, {
                              purchase_price: Math.max(0.01, Number(e.target.value)),
                            })
                          }
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-fg">
                        <Money value={line.quantity * line.purchase_price} />
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          className="text-faint transition hover:text-danger"
                          onClick={() =>
                            setLines((current) =>
                              current.filter(
                                (item) => item.product_id !== line.product_id,
                              ),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-faint">
            No purchase items added.
          </div>
        )}

        <div className="flex flex-col items-end gap-4 border-t border-border p-5">
          <p className="text-lg text-fg">
            Total:{' '}
            <strong className="text-gradient">
              <Money value={total} />
            </strong>
          </p>
          <button
            className="btn-primary"
            disabled={!supplierId || !lines.length || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? 'Saving…' : 'Save purchase'}
          </button>
        </div>
      </section>
    </>
  )
}
