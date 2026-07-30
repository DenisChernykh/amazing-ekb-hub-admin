import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearCsrfToken,
  getOrFetchCsrfToken,
  peekCsrfToken,
  setCsrfToken,
} from './csrf-token'

function createDeferredToken() {
  let resolve!: (token: string) => void
  let reject!: (error: Error) => void
  const promise = new Promise<string>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, reject, resolve }
}

describe('CSRF token memory', () => {
  beforeEach(clearCsrfToken)

  it('starts without a cached token', () => {
    expect(peekCsrfToken()).toBeNull()
  })

  it('shares one in-flight fetch between concurrent callers', async () => {
    const deferred = createDeferredToken()
    const fetcher = vi.fn(() => deferred.promise)

    const first = getOrFetchCsrfToken(fetcher)
    const second = getOrFetchCsrfToken(fetcher)

    expect(fetcher).toHaveBeenCalledTimes(1)
    deferred.resolve('fetched-token')

    await expect(Promise.all([first, second])).resolves.toEqual([
      'fetched-token',
      'fetched-token',
    ])
    expect(peekCsrfToken()).toBe('fetched-token')
  })

  it('keeps a login token when a pre-login fetch resolves late', async () => {
    const deferred = createDeferredToken()
    const pending = getOrFetchCsrfToken(() => deferred.promise)

    setCsrfToken('login-token')
    deferred.resolve('pre-login-token')

    await expect(pending).resolves.toBe('pre-login-token')
    expect(peekCsrfToken()).toBe('login-token')
  })

  it('does not restore a cleared token from a pre-logout fetch', async () => {
    const deferred = createDeferredToken()
    const pending = getOrFetchCsrfToken(() => deferred.promise)

    clearCsrfToken()
    deferred.resolve('pre-logout-token')

    await expect(pending).resolves.toBe('pre-logout-token')
    expect(peekCsrfToken()).toBeNull()
  })

  it('retries after a rejected fetch', async () => {
    const deferred = createDeferredToken()
    const fetcher = vi
      .fn<() => Promise<string>>()
      .mockImplementationOnce(() => deferred.promise)
      .mockResolvedValueOnce('retry-token')

    const first = getOrFetchCsrfToken(fetcher)
    deferred.reject(new Error('offline'))

    await expect(first).rejects.toThrow('offline')
    await expect(getOrFetchCsrfToken(fetcher)).resolves.toBe('retry-token')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
