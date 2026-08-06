import type { PlaceImportOperationResponseDto } from '@/shared/api'
import { adminPlaceImportsStart } from '@/shared/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useStartPlaceImportMutation } from './place-import-mutations'

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  adminPlaceImportsStart: vi.fn(),
}))

const operation = {
  attempt: 1,
  captchaExpiresAt: null,
  category: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  error: null,
  id: 'operation-1',
  mapsUrl: null,
  organizationId: null,
  outcome: null,
  possibleDuplicate: null,
  previewExpiresAt: null,
  resultPlaceId: null,
  sourceUrl: 'https://yandex.ru/maps/org/spa/1',
  status: 'queued',
  targetCollection: { id: 'collection-1', slug: 'spa', title: 'SPA' },
  title: null,
  updatedAt: '2026-08-01T00:00:00.000Z',
  version: 1,
} satisfies PlaceImportOperationResponseDto

const wrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

describe('place import mutation bridge', () => {
  it('passes target collection only when supplied and stores durable response', async () => {
    vi.mocked(adminPlaceImportsStart).mockResolvedValue(operation)
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useStartPlaceImportMutation(), {
      wrapper: wrapper(queryClient),
    })

    await result.current.mutateAsync({
      url: 'https://yandex.ru/maps/org/spa/1',
      targetCollectionId: 'collection-1',
    })

    expect(adminPlaceImportsStart).toHaveBeenCalledWith({
      url: 'https://yandex.ru/maps/org/spa/1',
      targetCollectionId: 'collection-1',
    })
    expect(
      queryClient.getQueryData(['/v1/admin/place-imports/operation-1']),
    ).toEqual(operation)
  })

  it('does not manufacture targetCollectionId for untargeted starts', async () => {
    vi.mocked(adminPlaceImportsStart).mockResolvedValue({
      ...operation,
      targetCollection: null,
    })
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useStartPlaceImportMutation(), {
      wrapper: wrapper(queryClient),
    })

    await result.current.mutateAsync({
      url: 'https://yandex.ru/maps/org/spa/1',
    })

    expect(adminPlaceImportsStart).toHaveBeenCalledWith({
      url: 'https://yandex.ru/maps/org/spa/1',
    })
  })
})
