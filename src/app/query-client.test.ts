import {
  ApiNetworkError,
  ApiProblemError,
  ApiProtocolError,
} from '@/shared/api/client/api-errors'
import { describe, expect, it } from 'vitest'

import { shouldRetryQuery } from './query-client'

function problemError(status: number) {
  return new ApiProblemError(
    {
      type: 'https://api.example.test/problems/test',
      title: 'Raw backend title',
      status,
      detail: 'Raw backend detail',
      instance: 'urn:request:query-retry',
      code: status >= 500 ? 'DEPENDENCY_UNAVAILABLE' : 'VALIDATION_FAILED',
      requestId: 'request-query-retry',
    },
    null,
  )
}

describe('query retry policy', () => {
  it('retries only bounded network and 5xx failures', () => {
    expect(shouldRetryQuery(0, new ApiNetworkError())).toBe(true)
    expect(shouldRetryQuery(1, problemError(503))).toBe(true)
    expect(shouldRetryQuery(2, problemError(503))).toBe(false)
    expect(shouldRetryQuery(0, problemError(422))).toBe(false)
    expect(shouldRetryQuery(0, new ApiProtocolError())).toBe(false)
  })
})
