import { describe, expect, it } from 'vitest'
import { buildApiUrl, joinApiUrl } from './api-base-url'

describe('api base url helpers', () => {
  it('preserves the versioned path for the same-origin API root', () => {
    expect(buildApiUrl('/v1/auth/me')).toBe('/v1/auth/me')
  })

  it('joins a versioned path with an absolute API origin', () => {
    expect(joinApiUrl('https://api.example.test', '/v1/auth/me')).toBe(
      'https://api.example.test/v1/auth/me',
    )
  })

  it('rejects an endpoint path without a leading slash', () => {
    expect(() => joinApiUrl('/', 'v1/auth/me')).toThrow(
      'API path must start with /',
    )
  })
})
