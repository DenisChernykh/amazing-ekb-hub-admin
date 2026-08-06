import type { PlaceImportOperationResponseDto } from '@/shared/api'
import { adminPlaceImportsGetActive } from '@/shared/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useActivePlaceImportQuery } from './place-import-hooks'

vi.mock('@/shared/api', () => ({
  adminPlaceImportsGetActive: vi.fn(),
}))

const operation: PlaceImportOperationResponseDto = {
  attempt: 1,
  captchaExpiresAt: null,
  category: null,
  createdAt: '2026-07-22T10:00:00.000Z',
  error: null,
  id: 'operation-active',
  mapsUrl: 'https://yandex.ru/maps/org/spa/1',
  organizationId: null,
  outcome: null,
  possibleDuplicate: null,
  previewExpiresAt: null,
  resultPlaceId: null,
  sourceUrl: 'https://yandex.ru/maps/org/spa/1',
  status: 'queued',
  targetCollection: null,
  title: null,
  updatedAt: '2026-07-22T10:00:00.000Z',
  version: 1,
}

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

describe('useActivePlaceImportQuery', () => {
  beforeEach(() => {
    vi.mocked(adminPlaceImportsGetActive).mockReset()
  })

  it('does not duplicate one route-entry lookup after a remount', async () => {
    const queryClient = new QueryClient()
    vi.mocked(adminPlaceImportsGetActive).mockResolvedValue(operation)
    const wrapper = createWrapper(queryClient)

    const firstRender = renderHook(
      () => useActivePlaceImportQuery('route-entry-1'),
      {
        wrapper,
      },
    )
    await waitFor(() => expect(firstRender.result.current.isSuccess).toBe(true))
    firstRender.unmount()

    const secondRender = renderHook(
      () => useActivePlaceImportQuery('route-entry-1'),
      {
        wrapper,
      },
    )
    await waitFor(() =>
      expect(secondRender.result.current.isSuccess).toBe(true),
    )

    expect(adminPlaceImportsGetActive).toHaveBeenCalledTimes(1)
  })

  it('performs a fresh lookup for the next start-route entry', async () => {
    const queryClient = new QueryClient()
    vi.mocked(adminPlaceImportsGetActive).mockResolvedValue(operation)
    const wrapper = createWrapper(queryClient)

    const firstRender = renderHook(
      () => useActivePlaceImportQuery('route-entry-1'),
      {
        wrapper,
      },
    )
    await waitFor(() => expect(firstRender.result.current.isSuccess).toBe(true))
    firstRender.unmount()

    const secondRender = renderHook(
      () => useActivePlaceImportQuery('route-entry-2'),
      {
        wrapper,
      },
    )
    await waitFor(() =>
      expect(secondRender.result.current.isSuccess).toBe(true),
    )

    expect(adminPlaceImportsGetActive).toHaveBeenCalledTimes(2)
  })

  it('deduplicates an in-flight route-entry lookup across dev remounts', async () => {
    const queryClient = new QueryClient()
    vi.mocked(adminPlaceImportsGetActive).mockResolvedValue(operation)
    const wrapper = createWrapper(queryClient)

    const firstRender = renderHook(
      () => useActivePlaceImportQuery('route-entry-1'),
      {
        wrapper,
      },
    )
    firstRender.unmount()

    const secondRender = renderHook(
      () => useActivePlaceImportQuery('route-entry-1'),
      {
        wrapper,
      },
    )
    await waitFor(() =>
      expect(secondRender.result.current.isSuccess).toBe(true),
    )

    expect(adminPlaceImportsGetActive).toHaveBeenCalledTimes(1)
  })
})
