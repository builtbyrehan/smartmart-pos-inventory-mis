import { describe, expect, it } from 'vitest'
import { loginSchema } from './LoginPage'

describe('login validation', () => {
  it('rejects an empty username and password', () => expect(loginSchema.safeParse({ username: '', password: '' }).success).toBe(false))
  it('accepts supplied credentials', () => expect(loginSchema.safeParse({ username: 'admin', password: 'admin123' }).success).toBe(true))
})
