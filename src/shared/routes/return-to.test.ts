import { describe, expect, it } from 'vitest'

import { sanitizeReturnTo } from './return-to'

describe('sanitizeReturnTo', () => {
  it.each([
    [undefined, '/'],
    [null, '/'],
    ['', '/'],
    ['https://evil.test/steal', '/'],
    ['//evil.test/steal', '/'],
    ['/login', '/'],
    ['/login?returnTo=%2Fplaces', '/'],
    ['/places?status=hidden#results', '/places?status=hidden#results'],
  ])('maps %s to %s', (input, expected) => {
    expect(sanitizeReturnTo(input)).toBe(expected)
  })
})
