import { QueryClient } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearCsrfToken,
  peekCsrfToken,
  setCsrfToken,
  type CurrentUserResponseDto,
} from '@/shared/api'
import { server } from '@/test/msw/server'

import { currentSessionQueryKey } from '../api/session'
import { clearCurrentSession, refreshCurrentSession } from './session-cache'

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: 'http://api.test' },
}))

const cachedUser: CurrentUserResponseDto = {
  normalizedEmail: 'cached@example.test',
  permissions: [],
  roleKeys: ['admin'],
  userId: 'cached-user',
}

const freshUser: CurrentUserResponseDto = {
  normalizedEmail: 'fresh@example.test',
  permissions: ['admin.dashboard.read'],
  roleKeys: ['admin', 'moderator'],
  userId: 'fresh-user',
}

describe('session cache helpers', () => {
  beforeEach(() => {
    clearCsrfToken()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('invalidates a fresh cache entry before fetching the current session', async () => {
    let currentSessionRequests = 0
    server.use(
      http.get('http://api.test/v1/auth/me', () => {
        currentSessionRequests += 1
        return HttpResponse.json(freshUser)
      }),
    )
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Number.POSITIVE_INFINITY,
        },
      },
    })
    queryClient.setQueryData(currentSessionQueryKey(), cachedUser)
    window.localStorage.setItem('local-marker', 'keep')
    window.sessionStorage.setItem('session-marker', 'keep')
    const storageWrite = vi.spyOn(Storage.prototype, 'setItem')
    const storageRemove = vi.spyOn(Storage.prototype, 'removeItem')

    const result = await refreshCurrentSession(queryClient)

    expect(result).toEqual(freshUser)
    expect(currentSessionRequests).toBe(1)
    expect(queryClient.getQueryData(currentSessionQueryKey())).toEqual(
      freshUser,
    )
    expect(window.localStorage.getItem('local-marker')).toBe('keep')
    expect(window.sessionStorage.getItem('session-marker')).toBe('keep')
    expect(storageWrite).not.toHaveBeenCalled()
    expect(storageRemove).not.toHaveBeenCalled()
  })

  it('removes only query and CSRF cache without writing browser storage', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(currentSessionQueryKey(), cachedUser)
    setCsrfToken('csrf-before-clear')
    window.localStorage.setItem('local-marker', 'keep')
    window.sessionStorage.setItem('session-marker', 'keep')
    const storageWrite = vi.spyOn(Storage.prototype, 'setItem')
    const storageRemove = vi.spyOn(Storage.prototype, 'removeItem')

    clearCurrentSession(queryClient)

    expect(queryClient.getQueryData(currentSessionQueryKey())).toBeUndefined()
    expect(peekCsrfToken()).toBeNull()
    expect(window.localStorage.getItem('local-marker')).toBe('keep')
    expect(window.sessionStorage.getItem('session-marker')).toBe('keep')
    expect(storageWrite).not.toHaveBeenCalled()
    expect(storageRemove).not.toHaveBeenCalled()
  })
})
