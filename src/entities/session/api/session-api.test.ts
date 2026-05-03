import { getGetCurrentUserQueryKey } from '@/shared/api/generated/auth/auth'
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import {
  getCurrentSessionQueryKey,
  invalidateCurrentSession,
  removeCurrentSession,
} from './session-api'

describe('session-api cache helpers', () => {
  it('keeps the public session query key aligned with generated API', () => {
    expect(getCurrentSessionQueryKey()).toEqual(getGetCurrentUserQueryKey())
  })

  it('invalidates current session query through a passed query client', async () => {
    const queryClient = new QueryClient()
    const queryKey = getCurrentSessionQueryKey()

    queryClient.setQueryData(queryKey, {
      email: 'admin@amazing-ekb.ru',
      id: 'admin-1',
      role: 'admin',
    })

    await invalidateCurrentSession(queryClient)

    expect(
      queryClient.getQueryCache().find({ queryKey })?.state.isInvalidated,
    ).toBe(true)
  })

  it('removes current session query through a passed query client', () => {
    const queryClient = new QueryClient()
    const queryKey = getCurrentSessionQueryKey()

    queryClient.setQueryData(queryKey, {
      email: 'admin@amazing-ekb.ru',
      id: 'admin-1',
      role: 'admin',
    })

    removeCurrentSession(queryClient)

    expect(queryClient.getQueryData(queryKey)).toBeUndefined()
  })
})
