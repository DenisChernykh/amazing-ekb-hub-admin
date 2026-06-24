import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildApiUrl, getApiBaseUrl } from './api-base-url'

describe('api base url helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('keeps the shared default API base url', () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined)

    expect(getApiBaseUrl()).toBe('/v1')
    expect(buildApiUrl('/admin/import-runs/run-1/events')).toBe(
      '/v1/admin/import-runs/run-1/events',
    )
  })

  it('builds URLs from a configured absolute API base url', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/v1/')

    expect(buildApiUrl('admin/import-runs/run-1/events')).toBe(
      'https://api.example.test/v1/admin/import-runs/run-1/events',
    )
  })
})
