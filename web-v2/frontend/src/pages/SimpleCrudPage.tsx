import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '../api/client'
import { DataTable, type Column } from '../components/DataTable'
import { Alert, Modal, PageHeader, SearchBox, Spinner } from '../components/ui'

type RecordRow = { id: number; [key: string]: unknown }
type Field = {
  key: string
  label: string
  type?: 'text' | 'email' | 'tel'
  required?: boolean
}

export function SimpleCrudPage({
  title,
  subtitle,
  endpoint,
  fields,
  canEdit = true,
}: {
  title: string
  subtitle: string
  endpoint: string
  fields: Field[]
  canEdit?: boolean
}) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<RecordRow | 'new' | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})

  const query = useQuery({
    queryKey: [endpoint],
    queryFn: () => api.get<RecordRow[]>(endpoint).then((r) => r.data),
  })

  const save = useMutation({
    mutationFn: () => {
      const payload = Object.fromEntries(
        fields.map((field) => [field.key, form[field.key]?.trim() || null]),
      )
      return editing === 'new'
        ? api.post(endpoint, payload)
        : api.put(`${endpoint}/${editing!.id}`, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [endpoint] })
      setEditing(null)
    },
  })

  const open = (row: RecordRow | 'new') => {
    setEditing(row)
    setForm(
      Object.fromEntries(
        fields.map((field) => [
          field.key,
          row === 'new' ? '' : String(row[field.key] ?? ''),
        ]),
      ),
    )
  }

  const rows = (query.data ?? []).filter((row) =>
    Object.values(row).some((value) =>
      String(value ?? '').toLowerCase().includes(search.toLowerCase()),
    ),
  )

  const columns: Column<RecordRow>[] = [
    ...fields.map((field) => ({
      key: field.key,
      header: field.label,
      render: (row: RecordRow) => String(row[field.key] ?? '—'),
    })),
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (row: RecordRow) => (
              <button className="btn-secondary" onClick={() => open(row)}>
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            ),
          },
        ]
      : []),
  ]

  if (query.isLoading) return <Spinner label={`Loading ${title.toLowerCase()}`} />

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          canEdit ? (
            <button className="btn-primary" onClick={() => open('new')}>
              <Plus className="h-4 w-4" />
              Add {title.slice(0, -1)}
            </button>
          ) : null
        }
      />

      <div className="card mb-4 p-4">
        <SearchBox value={search} onChange={setSearch} />
      </div>

      {query.isError ? (
        <div className="mb-4">
          <Alert>{errorMessage(query.error)}</Alert>
        </div>
      ) : null}

      <section className="card overflow-hidden">
        <DataTable rows={rows} columns={columns} />
      </section>

      {editing ? (
        <Modal
          title={
            editing === 'new'
              ? `Add ${title.slice(0, -1)}`
              : `Edit ${title.slice(0, -1)}`
          }
          onClose={() => setEditing(null)}
        >
          <form
            className="space-y-4"
            onSubmit={(event: FormEvent) => {
              event.preventDefault()
              save.mutate()
            }}
          >
            {save.isError ? (
              <Alert>{errorMessage(save.error)}</Alert>
            ) : null}
            {fields.map((field) => (
              <div key={field.key}>
                <label className="label" htmlFor={field.key}>
                  {field.label}
                </label>
                <input
                  id={field.key}
                  type={field.type ?? 'text'}
                  className="input"
                  required={field.required}
                  value={form[field.key] ?? ''}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      [field.key]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="btn-primary" disabled={save.isPending}>
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  )
}

export const CategoriesPage = () => (
  <SimpleCrudPage
    title="Categories"
    subtitle="Organize the product catalog."
    endpoint="/categories"
    fields={[{ key: 'name', label: 'Category name', required: true }]}
  />
)
export const CustomersPage = () => (
  <SimpleCrudPage
    title="Customers"
    subtitle="Maintain customer contact details for sales."
    endpoint="/customers"
    fields={[
      { key: 'name', label: 'Customer name', required: true },
      { key: 'phone', label: 'Phone', type: 'tel', required: true },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'address', label: 'Address' },
    ]}
  />
)
export const SuppliersPage = () => (
  <SimpleCrudPage
    title="Suppliers"
    subtitle="Maintain supplier and purchasing contacts."
    endpoint="/suppliers"
    fields={[
      { key: 'name', label: 'Supplier name', required: true },
      { key: 'contact_person', label: 'Contact person' },
      { key: 'phone', label: 'Phone', type: 'tel', required: true },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'address', label: 'Address' },
    ]}
  />
)
