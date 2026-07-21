import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '../api/client'
import { DataTable, type Column } from '../components/DataTable'
import { Alert, Modal, PageHeader, Spinner } from '../components/ui'
import type { Role, User } from '../types'

const roles: Role[] = ['Admin', 'Manager', 'Cashier', 'Inventory Officer', 'Purchase Officer', 'Sales Executive']
type Form = { username: string; full_name: string; password: string; role: Role; is_active: boolean }
const blank: Form = { username: '', full_name: '', password: '', role: 'Cashier', is_active: true }

export function UsersPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<User | 'new' | null>(null)
  const [form, setForm] = useState<Form>(blank)
  const query = useQuery({ queryKey: ['users'], queryFn: () => api.get<User[]>('/users').then((r) => r.data) })
  const save = useMutation({ mutationFn: () => editing === 'new' ? api.post('/users', form) : api.put(`/users/${editing!.id}`, { full_name: form.full_name, role: form.role, is_active: form.is_active, password: form.password || null }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditing(null) } })
  const open = (row: User | 'new') => { setEditing(row); setForm(row === 'new' ? blank : { username: row.username, full_name: row.full_name, password: '', role: row.role, is_active: row.is_active }) }
  if (query.isLoading) return <Spinner label="Loading users" />
  const columns: Column<User>[] = [{ key: 'name', header: 'User', render: (u) => <div><strong>{u.full_name}</strong><p className="text-xs text-slate-400">@{u.username}</p></div> }, { key: 'role', header: 'Role', render: (u) => u.role }, { key: 'active', header: 'Status', render: (u) => <span className={`badge ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{u.is_active ? 'Active' : 'Inactive'}</span> }, { key: 'edit', header: '', render: (u) => <button className="btn-secondary" onClick={() => open(u)}><Pencil className="h-4 w-4" /> Edit</button> }]
  return <><PageHeader title="Users" subtitle="Administer staff accounts and role-based access." action={<button className="btn-primary" onClick={() => open('new')}><Plus className="h-4 w-4" /> Add user</button>} />{query.isError && <div className="mb-4"><Alert>{errorMessage(query.error)}</Alert></div>}<section className="card overflow-hidden"><DataTable rows={query.data ?? []} columns={columns} /></section>
    {editing && <Modal title={editing === 'new' ? 'Add user' : 'Edit user'} onClose={() => setEditing(null)}><form className="space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate() }}>{save.isError && <Alert>{errorMessage(save.error)}</Alert>}<div><label className="label">Username</label><input className="input" required disabled={editing !== 'new'} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div><div><label className="label">Full name</label><input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div><div><label className="label">Role</label><select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></div><div><label className="label">{editing === 'new' ? 'Password' : 'New password (optional)'}</label><input className="input" type="password" minLength={8} required={editing === 'new'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>{editing !== 'new' && <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active account</label>}<div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save user'}</button></div></form></Modal>}
  </>
}
