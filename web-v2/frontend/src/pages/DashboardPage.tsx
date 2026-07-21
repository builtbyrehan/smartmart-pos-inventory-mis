import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Banknote,
  Boxes,
  FileText,
  PackageCheck,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { api, errorMessage } from '../api/client'
import { Money, PageHeader, Spinner } from '../components/ui'

type Dashboard = {
  summary: {
    total_sales_revenue: number
    gross_profit: number
    inventory_cost_value: number
    potential_retail_value: number
    low_stock_count: number
    total_products: number
    sales_invoices: number
    customers: number
  }
  monthly_sales: Array<{
    month: string
    revenue: number
    profit: number
  }>
  category_profit: Array<{
    category: string
    revenue: number
    profit: number
    margin: number
  }>
  low_stock: Array<{
    id: number
    name: string
    stock_quantity: number
    reorder_level: number
    supplier?: string
    status?: string
  }>
}

const formatMoney = (value: unknown) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return 'Rs 0'
  }

  return `Rs ${number.toLocaleString('en-PK')}`
}

const formatCompactMoney = (value: unknown) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return 'Rs 0'
  }

  return `Rs ${new Intl.NumberFormat('en-PK', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number)}`
}

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
}

export function DashboardPage() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: () =>
      api.get<Dashboard>('/dashboard').then((response) => response.data),
  })

  if (query.isLoading) {
    return <Spinner label="Loading dashboard" />
  }

  if (query.isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dashboard" />

        <div className="card p-5 text-red-700">
          {errorMessage(query.error)}
        </div>
      </div>
    )
  }

  const data = query.data!

  const cards = [
    {
      label: 'Total revenue',
      value: <Money value={data.summary.total_sales_revenue} />,
      icon: Banknote,
      tone: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Gross profit',
      value: <Money value={data.summary.gross_profit} />,
      icon: TrendingUp,
      tone: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Inventory cost',
      value: <Money value={data.summary.inventory_cost_value} />,
      icon: Boxes,
      tone: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'Potential retail',
      value: <Money value={data.summary.potential_retail_value} />,
      icon: WalletCards,
      tone: 'bg-cyan-100 text-cyan-700',
    },
    {
      label: 'Low-stock products',
      value: data.summary.low_stock_count,
      icon: AlertTriangle,
      tone: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Total products',
      value: data.summary.total_products,
      icon: PackageCheck,
      tone: 'bg-indigo-100 text-indigo-700',
    },
    {
      label: 'Sales invoices',
      value: data.summary.sales_invoices,
      icon: FileText,
      tone: 'bg-rose-100 text-rose-700',
    },
    {
      label: 'Customers',
      value: data.summary.customers,
      icon: Users,
      tone: 'bg-teal-100 text-teal-700',
    },
  ]

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="A live overview of sales and inventory health."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div className="card p-5" key={label}>
            <div
              className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${tone}`}
            >
              <Icon className="h-5 w-5" />
            </div>

            <p className="text-sm font-medium text-slate-500">{label}</p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-bold text-slate-900">
              Monthly revenue vs gross profit
            </h2>

            <span className="text-xs font-medium text-slate-500">
              Values in PKR
            </span>
          </div>

          <div className="mt-5 h-80">
            {data.monthly_sales.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.monthly_sales}
                  margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
                  accessibilityLayer
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="month"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />

                  <YAxis
                    width={72}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCompactMoney(value)}
                  />

                  <Tooltip
                    formatter={(value, name) => [
                      formatMoney(value),
                      String(name),
                    ]}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  />

                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{ paddingBottom: '14px' }}
                  />

                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#0f766e"
                    radius={[6, 6, 0, 0]}
                  />

                  <Bar
                    dataKey="profit"
                    name="Gross profit"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-slate-400">
                Sales will appear here.
              </div>
            )}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-bold text-slate-900">
              Profit by category
            </h2>

            <span className="text-xs font-medium text-slate-500">
              Values in PKR
            </span>
          </div>

          <div className="mt-5 h-80">
            {data.category_profit.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.category_profit}
                  layout="vertical"
                  margin={{ top: 8, right: 20, left: 8, bottom: 4 }}
                  accessibilityLayer
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    type="number"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(value) => formatCompactMoney(value)}
                  />

                  <YAxis
                    type="category"
                    dataKey="category"
                    width={112}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [
                      formatMoney(value),
                      'Gross profit',
                    ]}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  />

                  <Bar
                    dataKey="profit"
                    name="Gross profit"
                    fill="#14b8a6"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-slate-400">
                No category profit yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900">
            Low-stock attention list
          </h2>
        </div>

        {data.low_stock.length ? (
          <div className="divide-y divide-slate-100">
            {data.low_stock.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {item.name}
                  </p>

                  {item.supplier ? (
                    <p className="mt-0.5 text-xs text-slate-500">
                      Supplier: {item.supplier}
                    </p>
                  ) : null}
                </div>

                <span className="badge w-fit bg-amber-100 text-amber-800">
                  {item.stock_quantity} left · reorder at{' '}
                  {item.reorder_level}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm text-emerald-700">
            All active products are above their reorder level.
          </div>
        )}
      </section>
    </>
  )
}