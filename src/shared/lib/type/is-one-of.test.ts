import { describe, expect, it } from 'vitest'
import { isOneOf } from './is-one-of'

describe('isOneOf', () => {
  it('checks whether an unknown value belongs to a literal string allowlist', () => {
    const values = ['telegram', 'dzen']

    expect(isOneOf(values, 'telegram')).toBe(true)
    expect(isOneOf(values, 'youtube')).toBe(false)
    expect(isOneOf(values, 1)).toBe(false)
    expect(isOneOf(values, null)).toBe(false)
  })
})
