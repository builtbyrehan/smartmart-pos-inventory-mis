import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from './ui'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  sortValue?: (row: T) => string | number | boolean | null | undefined
  sortable?: boolean
}

export function DataTable<T>({
  rows,
  columns,
  empty = 'No records found.',
}: {
  rows: T[]
  columns: Column<T>[]
  empty?: string
}) {
  const [sort, setSort] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => setPage(1), [rows])

  const ordered = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((item) => item.key === sort.key)
    if (!column) return rows
    const value = (row: T) =>
      column.sortValue
        ? column.sortValue(row)
        : ((row as Record<string, unknown>)[column.key] as
            | string
            | number
            | boolean
            | null
            | undefined)
    return [...rows].sort((a, b) =>
      String(value(a) ?? '').localeCompare(String(value(b) ?? ''), undefined, {
        numeric: true,
      }) * (sort.direction === 'asc' ? 1 : -1),
    )
  }, [rows, columns, sort])

  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize))
  const visible = ordered.slice((page - 1) * pageSize, page * pageSize)

  if (!rows.length) {
    return <EmptyState title="Nothing here yet" message={empty} />
  }

  const toggleSort = (column: Column<T>) => {
    if (
      column.sortable === false ||
      column.key === 'actions' ||
      column.key === 'edit' ||
      column.key === 'view'
    ) {
      return
    }
    setSort((current) =>
      current?.key === column.key
        ? {
            key: column.key,
            direction: current.direction === 'asc' ? 'desc' : 'asc',
          }
        : { key: column.key, direction: 'asc' },
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-border bg-card-2/60 text-xs uppercase tracking-wide text-faint backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3.5 font-semibold ${column.className ?? ''}`}
                >
                  <button
                    className="inline-flex items-center gap-1 uppercase transition-colors hover:text-fg disabled:cursor-default"
                    disabled={
                      column.sortable === false ||
                      column.key === 'actions' ||
                      column.key === 'edit' ||
                      column.key === 'view'
                    }
                    onClick={() => toggleSort(column)}
                  >
                    {column.header}
                    {sort?.key === column.key ? (
                      <span
                        className="text-brand-400"
                        aria-label={
                          sort.direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                        }
                      >
                        {sort.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {visible.map((row, index) => (
              <tr
                key={(page - 1) * pageSize + index}
                className="transition-colors hover:bg-accent/5"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3.5 text-fg ${column.className ?? ''}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 ? (
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
          <span className="text-muted">
            Page <span className="font-semibold text-fg">{page}</span> of{' '}
            {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              className="btn-secondary"
              disabled={page === pageCount}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
