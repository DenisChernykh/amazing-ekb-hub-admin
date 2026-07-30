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
    ['/LOGIN', '/'],
    ['/LOGIN?returnTo=%2Fplaces#form', '/'],
    ['/login/', '/'],
    ['/login/?returnTo=%2Fplaces#form', '/'],
    ['/%6Cogin', '/'],
    ['/%6Cogin?returnTo=%2Fplaces#form', '/'],
    ['/login-help', '/login-help'],
    ['/login/profile', '/login/profile'],
    ['/places?status=hidden#results', '/places?status=hidden#results'],
  ])('maps %s to %s', (input, expected) => {
    expect(sanitizeReturnTo(input)).toBe(expected)
  })
})
