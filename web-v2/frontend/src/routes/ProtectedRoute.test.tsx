import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '../types'
import { ProtectedRoute } from './ProtectedRoute'

const state = vi.hoisted(() => ({ user: null as User | null, loading: false }))
vi.mock('../auth/AuthContext', () => ({ useAuth: () => state }))

function renderRoutes() {
  render(<MemoryRouter initialEntries={['/private']}><Routes><Route path="/login" element={<div>Login page</div>} /><Route path="/unauthorized" element={<div>Unauthorized page</div>} /><Route path="/private" element={<ProtectedRoute roles={['Admin']}><div>Private page</div></ProtectedRoute>} /></Routes></MemoryRouter>)
}

describe('protected routing', () => {
  beforeEach(() => { state.user = null; state.loading = false })
  it('redirects signed-out visitors to login', () => { renderRoutes(); expect(screen.getByText('Login page')).toBeInTheDocument() })
  it('redirects a role without permission', () => { state.user = { id: 2, username: 'cashier', full_name: 'Cashier', role: 'Cashier', is_active: true }; renderRoutes(); expect(screen.getByText('Unauthorized page')).toBeInTheDocument() })
})
