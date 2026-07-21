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
import {
  Money,
  PageHeader,
  Spinner,
  StatCard,
} from '../components/ui'
import {
  chartAxisStroke,
  chartColors,
  chartCursorFill,
  chartGradients,
  chartGridStroke,
  chartTickColor,
  chartTooltipStyle,
  fillFor,
} from '../utils/chartTheme'

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
  if (!Number.isFinite(number)) return 'Rs 0'
  return `Rs ${number.toLocaleString('en-PK')}`
}

const formatCompactMoney = (value: unknown) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return 'Rs 0'
  return `Rs ${new Intl.NumberFormat('en-PK', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number)}`
}

const compactMoneyFormatter = (n: number) =>
  `Rs ${new Intl.NumberFormat('en-PK', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)}`

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
        <div className="card p-5 text-danger">{errorMessage(query.error)}</div>
      </div>
    )
  }

  const data = query.data!

  const cards = [
    {
      label: 'Total revenue',
      value: data.summary.total_sales_revenue,
      icon: Banknote,
      tone: 'emerald' as const,
      format: compactMoneyFormatter,
    },
    {
      label: 'Gross profit',
      value: data.summary.gross_profit,
      icon: TrendingUp,
      tone: 'brand' as const,
      format: compactMoneyFormatter,
    },
    {
      label: 'Inventory cost',
      value: data.summary.inventory_cost_value,
      icon: Boxes,
      tone: 'violet' as const,
      format: compactMoneyFormatter,
    },
    {
      label: 'Potential retail',
      value: data.summary.potential_retail_value,
      icon: WalletCards,
      tone: 'cyan' as const,
      format: compactMoneyFormatter,
    },
    {
      label: 'Low-stock products',
      value: data.summary.low_stock_count,
      icon: AlertTriangle,
      tone: 'amber' as const,
    },
    {
      label: 'Total products',
      value: data.summary.total_products,
      icon: PackageCheck,
      tone: 'blue' as const,
    },
    {
      label: 'Sales invoices',
      value: data.summary.sales_invoices,
      icon: FileText,
      tone: 'rose' as const,
    },
    {
      label: 'Customers',
      value: data.summary.customers,
      icon: Users,
      tone: 'accent' as const,
    },
  ]

  const categoryColors = [
    chartColors.accent,
    chartColors.brand,
    chartColors.cyan,
    chartColors.emerald,
    chartColors.amber,
    chartColors.violet,
    chartColors.blue,
    chartColors.rose,
  ]

  return (
    <>
      {/* Hero — Business Health Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card mb-8 p-6 md:p-8">
        {/* Subtle chartreuse glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card-2 px-3 py-1 text-xs font-semibold text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live Telemetry
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-fg">
              State of the <span className="text-brand-500">Business</span>
            </h1>
            <p className="mt-2 text-sm text-muted max-w-md leading-relaxed">
              Real-time sales performance, margin spread, and inventory health metrics.
            </p>
          </div>

          <div className="grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-card-2 overflow-hidden shrink-0">
            <div className="px-5 py-3.5 text-left">
              <p className="text-[11px] uppercase tracking-wider text-muted font-bold mb-1">Total Revenue</p>
              <p className="text-xl md:text-2xl font-bold text-fg font-mono tracking-tight">
                {compactMoneyFormatter(data.summary.total_sales_revenue)}
              </p>
            </div>
            <div className="px-5 py-3.5 text-left">
              <p className="text-[11px] uppercase tracking-wider text-muted font-bold mb-1">Gross Profit</p>
              <p className="text-xl md:text-2xl font-bold text-brand-500 font-mono tracking-tight">
                {compactMoneyFormatter(data.summary.gross_profit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Bento Layout */}
      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Column: KPI Grid & Main Chart (2 cols wide) */}
        <div className="xl:col-span-2 space-y-8">
          <div className="grid gap-5 grid-cols-2 lg:grid-cols-3">
            {cards.map(({ label, value, icon, tone, format }) => (
              <StatCard
                key={label}
                label={label}
                value={value}
                icon={icon}
                tone={tone}
                format={format}
              />
            ))}
          </div>

          <section className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-fg">Revenue vs Gross Profit Velocity</h2>
                <p className="text-xs text-muted">Monthly financial comparison across active quarters</p>
              </div>
              <span className="badge badge-neutral text-xs">PKR Standard</span>
            </div>

            <div className="h-80">
              {data.monthly_sales.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.monthly_sales}
                    margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
                    accessibilityLayer
                  >
                    <defs>{chartGradients}</defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridStroke()} />
                    <XAxis
                      dataKey="month"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: chartAxisStroke() }}
                      tick={{ fill: chartTickColor() }}
                    />
                    <YAxis
                      width={72}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: chartTickColor() }}
                      tickFormatter={(value) => formatCompactMoney(value)}
                    />
                    <Tooltip
                      formatter={(value, name) => [formatMoney(value), String(name)]}
                      contentStyle={chartTooltipStyle()}
                      cursor={{ fill: chartCursorFill() }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      iconSize={9}
                      wrapperStyle={{ paddingBottom: '14px', color: chartTickColor() }}
                    />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill={fillFor('gradInk')}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationDuration={800}
                    />
                    <Bar
                      dataKey="profit"
                      name="Gross profit"
                      fill={fillFor('gradChartreuse')}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationDuration={800}
                      animationBegin={100}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-faint">
                  Sales telemetry will populate upon first transaction.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Category Distribution & Stock Alerts Rail */}
        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-base font-bold text-fg">Category Performance</h2>
              <span className="text-xs text-muted">Profit contribution</span>
            </div>

            <div className="h-64">
              {data.category_profit.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.category_profit}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                    accessibilityLayer
                  >
                    <defs>{chartGradients}</defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridStroke()} />
                    <XAxis
                      type="number"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: chartAxisStroke() }}
                      tick={{ fill: chartTickColor() }}
                      tickFormatter={(value) => formatCompactMoney(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={100}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: chartTickColor() }}
                    />
                    <Tooltip
                      formatter={(value) => [formatMoney(value), 'Gross Profit']}
                      contentStyle={chartTooltipStyle()}
                      cursor={{ fill: chartCursorFill() }}
                    />
                    <Bar
                      dataKey="profit"
                      name="Gross profit"
                      fill={fillFor('gradChartreuse')}
                      radius={[0, 6, 6, 0]}
                      isAnimationActive
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-faint">
                  No category distribution recorded yet.
                </div>
              )}
            </div>
          </section>

          {/* Low Stock Attention Radar */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-card-2/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h2 className="font-bold text-fg text-sm">Stock Attention Radar</h2>
              </div>
              <span className="badge badge-warning text-xs">{data.low_stock.length} Low</span>
            </div>

            {data.low_stock.length ? (
              <div className="divide-y divide-border-soft max-h-72 overflow-y-auto">
                {data.low_stock.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 hover:bg-card-hover/40 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-fg text-sm">{item.name}</p>
                      {item.supplier ? (
                        <p className="text-xs text-muted mt-0.5">Supplier: {item.supplier}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="badge badge-warning text-xs">
                        {item.stock_quantity} remaining
                      </span>
                      <p className="text-[11px] text-faint mt-0.5">Threshold: {item.reorder_level}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-emerald-400 font-medium">
                ✨ Catalog optimal. All items above reorder thresholds.
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
