import { useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../api/client'
import { DataTable, type Column } from '../components/DataTable'
import { Alert, Money, PageHeader, Spinner } from '../components/ui'
import type { Purchase, Sale } from '../types'
import { formatDate } from '../utils/format'

export function SalesHistoryPage() {
  const query = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.get<Sale[]>('/sales').then((r) => r.data),
  })
  const columns: Column<Sale>[] = [
    {
      key: 'invoice',
      header: 'Invoice',
      render: (r) => <strong className="text-fg">{r.invoice_number}</strong>,
    },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.sale_date) },
    { key: 'customer', header: 'Customer', render: (r) => r.customer_name },
    { key: 'cashier', header: 'Cashier', render: (r) => r.cashier_name },
    {
      key: 'total',
      header: 'Total',
      render: (r) => <Money value={r.total_amount} />,
    },
    {
      key: 'view',
      header: '',
      className: 'text-right',
      render: (r) => (
        <Link className="btn-secondary" to={`/sales/${r.id}`}>
          <Eye className="h-4 w-4" />
          View
        </Link>
      ),
    },
  ]
  return (
    <History
      title="Sales History"
      subtitle="Review completed customer transactions."
      query={query}
      columns={columns}
    />
  )
}

export function PurchasesHistoryPage() {
  const query = useQuery({
    queryKey: ['purchases'],
    queryFn: () => api.get<Purchase[]>('/purchases').then((r) => r.data),
  })
  const columns: Column<Purchase>[] = [
    {
      key: 'invoice',
      header: 'Invoice',
      render: (r) => <strong className="text-fg">{r.invoice_number}</strong>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (r) => formatDate(r.purchase_date),
    },
    { key: 'supplier', header: 'Supplier', render: (r) => r.supplier_name },
    {
      key: 'total',
      header: 'Total',
      render: (r) => <Money value={r.total_amount} />,
    },
    {
      key: 'view',
      header: '',
      className: 'text-right',
      render: (r) => (
        <Link className="btn-secondary" to={`/purchases/${r.id}`}>
          <Eye className="h-4 w-4" />
          View
        </Link>
      ),
    },
  ]
  return (
    <History
      title="Purchase History"
      subtitle="Review inventory receipts and supplier invoices."
      query={query}
      columns={columns}
    />
  )
}

function History<T>({
  title,
  subtitle,
  query,
  columns,
}: {
  title: string
  subtitle: string
  query: {
    isLoading: boolean
    isError: boolean
    error: unknown
    data?: T[]
  }
  columns: Column<T>[]
}) {
  if (query.isLoading) return <Spinner label={`Loading ${title.toLowerCase()}`} />
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      {query.isError ? (
        <Alert>{errorMessage(query.error)}</Alert>
      ) : (
        <section className="card overflow-hidden">
          <DataTable rows={query.data ?? []} columns={columns} />
        </section>
      )}
    </>
  )
}
