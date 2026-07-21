import { describe, expect, it } from 'vitest'
import { purchaseEstimate, saleEstimate } from './calculations'

describe('transaction estimates', () => {
  it('calculates a multi-line POS cart', () => expect(saleEstimate([{ price: '80.00', quantity: 2 }, { price: 120, quantity: 3 }])).toBe(520))
  it('calculates purchase lines', () => expect(purchaseEstimate([{ purchase_price: '52.50', quantity: 4 }, { purchase_price: 10, quantity: 2 }])).toBe(230))
})
