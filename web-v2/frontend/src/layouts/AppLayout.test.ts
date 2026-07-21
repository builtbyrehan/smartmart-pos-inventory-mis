import { describe, expect, it } from 'vitest'
import { navigationForRole } from './AppLayout'

describe('role-based navigation', () => {
  it('gives cashiers POS but not dashboard or reports', () => {
    const links = navigationForRole('Cashier')
    expect(links).toContain('/pos')
    expect(links).not.toContain('/')
    expect(links).not.toContain('/reports')
  })
  it('gives purchase officers purchasing and reports but not POS', () => {
    const links = navigationForRole('Purchase Officer')
    expect(links).toContain('/purchases/new')
    expect(links).toContain('/reports')
    expect(links).not.toContain('/pos')
  })
})
