import { describe, expect, it } from 'vitest'
import { parsePositiveInteger } from './parse-positive-integer'

describe('parsePositiveInteger', () => {
  it('returns parsed positive integer', () => {
    expect(parsePositiveInteger('12', 1)).toBe(12)
  })

  it('returns fallback for absent or invalid values', () => {
    expect(parsePositiveInteger(null, 10)).toBe(10)
    expect(parsePositiveInteger('0', 10)).toBe(10)
    expect(parsePositiveInteger('1.5', 10)).toBe(10)
    expect(parsePositiveInteger('abc', 10)).toBe(10)
  })
})
