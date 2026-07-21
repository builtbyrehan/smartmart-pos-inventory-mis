import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert, Money } from './ui'

describe('shared UI', () => {
  it('renders accessible feedback', () => {
    render(<Alert>Saved safely</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent('Saved safely')
  })
  it('formats Pakistani rupees', () => {
    render(<Money value="160.00" />)
    expect(screen.getByText(/160/)).toBeInTheDocument()
  })
})
