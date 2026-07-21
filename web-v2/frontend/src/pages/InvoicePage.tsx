import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api, errorMessage } from '../api/client'
import { Alert, Money, Spinner } from '../components/ui'
import type { Purchase, Sale } from '../types'

export function InvoicePage({ kind }: { kind: 'sales' | 'purchases' }) {
  const { id } = useParams()
  const query = useQuery({ queryKey: [kind, id], queryFn: () => api.get<Sale | Purchase>(`/${kind}/${id}`).then((r) => r.data) })
  if (query.isLoading) return <Spinner label="Loading invoice" />
  if (query.isError) return <Alert>{errorMessage(query.error)}</Alert>
  const invoice = query.data!
  const isSale = kind === 'sales'
  const party = isSale ? (invoice as Sale).customer_name : (invoice as Purchase).supplier_name
  const date = isSale ? (invoice as Sale).sale_date : (invoice as Purchase).purchase_date
  return <><div className="no-print mb-5 flex justify-between"><Link className="btn-secondary" to={`/${kind}`}><ArrowLeft className="h-4 w-4" /> Back</Link><button className="btn-primary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button></div><article className="card mx-auto max-w-4xl p-8 md:p-12"><div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-8 sm:flex-row"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-brand-700">POS & Inventory MIS</p><h1 className="mt-2 text-3xl font-black text-slate-950">{isSale ? 'Sales Invoice' : 'Purchase Invoice'}</h1></div><div className="sm:text-right"><p className="font-mono text-sm font-bold">{invoice.invoice_number}</p><p className="mt-1 text-sm text-slate-500">{date}</p></div></div><div className="grid gap-6 py-8 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase text-slate-400">{isSale ? 'Customer' : 'Supplier'}</p><p className="mt-1 font-semibold">{party}</p></div>{isSale && <div><p className="text-xs font-bold uppercase text-slate-400">Cashier</p><p className="mt-1 font-semibold">{(invoice as Sale).cashier_name}</p></div>}</div><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm"><thead className="border-y border-slate-200 text-left"><tr><th className="py-3">Product</th><th className="py-3 text-right">Qty</th><th className="py-3 text-right">Unit price</th><th className="py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{invoice.items.map((line) => <tr key={line.product_id}><td className="py-4 font-medium">{line.product_name}</td><td className="py-4 text-right">{line.quantity}</td><td className="py-4 text-right"><Money value={'selling_price' in line ? line.selling_price : line.purchase_price} /></td><td className="py-4 text-right font-semibold"><Money value={line.line_total} /></td></tr>)}</tbody></table></div><div className="mt-8 flex justify-end"><div className="flex w-full max-w-xs items-center justify-between border-t-2 border-slate-900 pt-4 text-xl"><span className="font-semibold">Total</span><strong><Money value={invoice.total_amount} /></strong></div></div></article></>
}
