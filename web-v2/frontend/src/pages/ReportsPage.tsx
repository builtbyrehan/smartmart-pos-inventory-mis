import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { useState } from 'react'
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
import { DataTable, type Column } from '../components/DataTable'
import { Alert, Money, PageHeader, Spinner } from '../components/ui'
import {
  chartAxisStroke,
  chartCursorFill,
  chartGradients,
  chartGridStroke,
  chartTickColor,
  chartTooltipStyle,
  fillFor,
} from '../utils/chartTheme'
import { formatDate } from '../utils/format'

const reports = [
  {
    id: 'low-inventory',
    name: 'Low-inventory alerts',
    purpose: 'Identify products that require immediate replenishment.',
  },
  {
    id: 'top-profitable-products',
    name: 'Top 10 profitable products',
    purpose:
      'Focus selling and stocking decisions on the strongest profit contributors.',
  },
  {
    id: 'monthly-sales',
    name: 'Monthly sales and gross profit',
    purpose:
      'Compare revenue and estimated gross-profit performance over time.',
  },
  {
    id: 'inventory-valuation',
    name: 'Inventory valuation',
    purpose:
      'Understand capital held in stock and its potential retail value.',
  },
  {
    id: 'profit-by-category',
    name: 'Profit by category',
    purpose: 'Compare category-level revenue, margin, and profitability.',
  },
  {
    id: 'customer-analysis',
    name: 'Customer analysis and segmentation',
    purpose:
      'Recognize valuable and repeat customers for better service decisions.',
  },
  {
    id: 'sales-invoice-details',
    name: 'Sales invoice details',
    purpose: 'Audit every sold item back to its invoice, customer, and cashier.',
  },
  {
    id: 'sales-history',
    name: 'Sales history',
    purpose: 'Review the chronological sales record and invoice totals.',
  },
  {
    id: 'purchase-history',
    name: 'Purchase history',
    purpose: 'Review supplier receipts and purchasing expenditure.',
  },
]

type ChartBar = {
  key: string
  name: string
  color: string
  gradient?: string
  money?: boolean
}

type ChartConfiguration = {
  x: string
  bars: ChartBar[]
}

const charts: Record<string, ChartConfiguration> = {
  'low-inventory': {
    x: 'product_name',
    bars: [
      { key: 'stock_quantity', name: 'Current stock', color: '#fbbf24', gradient: 'gradAmber' },
      { key: 'reorder_level', name: 'Reorder level', color: '#64748b' },
    ],
  },
  'top-profitable-products': {
    x: 'product_name',
    bars: [
      { key: 'total_profit', name: 'Total profit', color: '#6366f1', gradient: 'gradIndigo', money: true },
    ],
  },
  'monthly-sales': {
    x: 'sales_month',
    bars: [
      { key: 'total_sales', name: 'Revenue', color: '#6366f1', gradient: 'gradIndigo', money: true },
      { key: 'gross_profit', name: 'Gross profit', color: '#06b6d4', gradient: 'gradCyan', money: true },
    ],
  },
  'inventory-valuation': {
    x: 'product_name',
    bars: [
      { key: 'inventory_cost_value', name: 'Inventory cost', color: '#8b5cf6', gradient: 'gradViolet', money: true },
    ],
  },
  'profit-by-category': {
    x: 'category_name',
    bars: [
      { key: 'total_profit', name: 'Total profit', color: '#34d399', gradient: 'gradEmerald', money: true },
    ],
  },
  'customer-analysis': {
    x: 'customer_name',
    bars: [
      { key: 'total_spent', name: 'Total spent', color: '#3b82f6', gradient: 'gradCyan', money: true },
    ],
  },
}

type Report = {
  name: string
  columns: string[]
  rows: Array<Record<string, unknown>>
}

const moneyColumns = new Set(['total', 'total_sales', 'line_total'])

const headerLabels: Record<string, string> = {
  product_id: 'ID',
  product_name: 'Product',
  category_name: 'Category',
  customer_id: 'Customer ID',
  customer_name: 'Customer',
  supplier_id: 'Supplier ID',
  supplier_name: 'Supplier',
  supplier_phone: 'Supplier phone',
  stock_quantity: 'Stock',
  reorder_level: 'Reorder level',
  shortage_quantity: 'Shortage',
  units_sold: 'Units sold',
  sales_revenue: 'Revenue',
  total_revenue: 'Revenue',
  total_cost: 'Total cost',
  total_profit: 'Total profit',
  gross_profit: 'Gross profit',
  profit_margin_percent: 'Margin %',
  sales_month: 'Month',
  total_invoices: 'Invoices',
  total_sales: 'Total sales',
  average_invoice_value: 'Avg invoice',
  inventory_cost_value: 'Inventory cost',
  potential_retail_value: 'Retail value',
  potential_sales_value: 'Retail value',
  total_spent: 'Total spent',
  total_purchases: 'Purchases',
  average_purchase: 'Avg purchase',
  purchase_date: 'Purchase date',
  sale_date: 'Sale date',
  invoice_number: 'Invoice',
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

const formatHeader = (key: string) => {
  if (headerLabels[key]) return headerLabels[key]
  return key
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

const isMoneyColumn = (key: string) =>
  moneyColumns.has(key) ||
  /(amount|price|revenue|cost|profit|value|spent|average)/.test(key)

const renderValue = (key: string, value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  if (key.includes('date')) return formatDate(String(value))
  if (key.includes('percent')) {
    const number = Number(value)
    return Number.isFinite(number)
      ? `${number.toLocaleString('en-PK', { maximumFractionDigits: 2 })}%`
      : '—'
  }
  if (isMoneyColumn(key)) return <Money value={Number(value)} />
  if (typeof value === 'number') return value.toLocaleString('en-PK')
  return String(value)
}

const shortenAxisLabel = (value: unknown) => {
  const label = String(value)
  return label.length > 18 ? `${label.slice(0, 16)}…` : label
}

export function ReportsPage() {
  const [selected, setSelected] = useState('low-inventory')

  const query = useQuery({
    queryKey: ['report', selected],
    queryFn: () =>
      api.get<Report>(`/reports/${selected}`).then((response) => response.data),
  })

  const selectedReport =
    reports.find((report) => report.id === selected) ?? reports[0]

  const chartConfig = charts[selected]

  const columns: Column<Record<string, unknown>>[] = (
    query.data?.columns ?? []
  ).map((key) => ({
    key,
    header: formatHeader(key),
    render: (row) => renderValue(key, row[key]),
  }))

  const download = async () => {
    const response = await api.get(`/reports/${selected}/csv`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selected}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const formatChartTooltip = (
    value: unknown,
    name: unknown,
  ): [string, string] => {
    const bar = chartConfig?.bars.find((item) => item.name === String(name))
    const formattedValue = bar?.money
      ? formatMoney(value)
      : Number(value).toLocaleString('en-PK')
    return [formattedValue, bar?.name ?? String(name)]
  }

  const chartUsesMoney =
    chartConfig?.bars.some((bar) => bar.money) ?? false

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Review operational information and export a CSV for analysis."
        action={
          <button
            className="btn-secondary"
            onClick={download}
            disabled={!query.data?.rows.length}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <div className="card mb-5 p-4">
        <label className="label">Report</label>
        <select
          className="input max-w-sm"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {reports.map((report) => (
            <option key={report.id} value={report.id}>
              {report.name}
            </option>
          ))}
        </select>
        <p className="mt-3 text-sm text-muted">
          <strong className="text-fg">Managerial purpose:</strong>{' '}
          {selectedReport.purpose}
        </p>
      </div>

      {query.isLoading ? (
        <Spinner label="Building report" />
      ) : query.isError ? (
        <Alert>{errorMessage(query.error)}</Alert>
      ) : (
        <div className="space-y-5">
          {chartConfig && query.data!.rows.length > 0 ? (
            <section className="card p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-bold text-fg">Visual summary</h2>
                <span className="text-xs font-medium text-muted">
                  {chartUsesMoney
                    ? 'Values in PKR'
                    : `${query.data!.rows.length} records`}
                </span>
              </div>

              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={query.data!.rows.slice(0, 15)}
                    margin={{
                      top: 8,
                      right: 14,
                      left: chartUsesMoney ? 12 : 0,
                      bottom: 8,
                    }}
                    accessibilityLayer
                  >
                    <defs>{chartGradients}</defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={chartGridStroke()}
                    />

                    <XAxis
                      dataKey={chartConfig.x}
                      fontSize={10}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={78}
                      tickLine={false}
                      axisLine={{ stroke: chartAxisStroke() }}
                      tick={{ fill: chartTickColor() }}
                      tickFormatter={shortenAxisLabel}
                    />

                    <YAxis
                      width={chartUsesMoney ? 74 : 42}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: chartTickColor() }}
                      tickFormatter={(value) =>
                        chartUsesMoney
                          ? formatCompactMoney(value)
                          : Number(value).toLocaleString('en-PK')
                      }
                    />

                    <Tooltip
                      formatter={formatChartTooltip}
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

                    {chartConfig.bars.map((bar) => (
                      <Bar
                        key={bar.key}
                        dataKey={bar.key}
                        name={bar.name}
                        fill={bar.gradient ? fillFor(bar.gradient) : bar.color}
                        radius={[5, 5, 0, 0]}
                        isAnimationActive
                        animationDuration={900}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          ) : null}

          <section className="card overflow-hidden">
            <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-bold text-fg">{selectedReport.name}</h2>
              <span className="text-sm text-muted">
                {query.data?.rows.length ?? 0}{' '}
                {(query.data?.rows.length ?? 0) === 1 ? 'record' : 'records'}
              </span>
            </div>

            <DataTable
              rows={query.data?.rows ?? []}
              columns={columns}
              empty="No data is available for this report."
            />
          </section>
        </div>
      )}
    </>
  )
}
