import type { PlaceImportOperationResponseDto } from '@/shared/api'
import { getAdminPlaceImportsGetQueryKey } from '@/shared/api'
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import {
  invalidatePlaceImportResultQueries,
  syncPlaceImportOperationCache,
} from './place-import-cache'

const operation = (
  overrides: Partial<PlaceImportOperationResponseDto>,
): PlaceImportOperationResponseDto => ({
  attempt: 1,
  captchaExpiresAt: null,
  category: null,
  createdAt: '2026-07-22T10:00:00.000Z',
  error: null,
  id: 'operation-1',
  mapsUrl: null,
  organizationId: null,
  outcome: null,
  possibleDuplicate: null,
  previewExpiresAt: null,
  resultPlaceId: null,
  sourceUrl: 'https://yandex.ru/maps/org/spa/1',
  status: 'parsing',
  targetCollection: null,
  title: null,
  updatedAt: '2026-07-22T10:01:00.000Z',
  version: 2,
  ...overrides,
})

describe('syncPlaceImportOperationCache', () => {
  it('does not let a delayed SSE snapshot overwrite a newer terminal mutation result', () => {
    const queryClient = new QueryClient()
    const completed = operation({
      outcome: 'created',
      resultPlaceId: 'place-1',
      status: 'completed',
      version: 5,
    })
    const delayedParsing = operation({ status: 'parsing', version: 4 })
    const queryKey = getAdminPlaceImportsGetQueryKey({
      operationId: completed.id,
    })
    queryClient.setQueryData(queryKey, completed)

    syncPlaceImportOperationCache(queryClient, delayedParsing)

    expect(queryClient.getQueryData(queryKey)).toEqual(completed)
  })
})

describe('invalidatePlaceImportResultQueries', () => {
  it('invalidates the durable target collection after completed import', async () => {
    const queryClient = new QueryClient()
    const operationWithTarget = operation({
      resultPlaceId: 'place-1',
      status: 'completed',
      targetCollection: { id: 'collection-1', slug: 'spa', title: 'SPA' },
    })
    const collectionListKey = ['/v1/admin/collections']
    const collectionDetailKey = ['/v1/admin/collections/collection-1']
    queryClient.setQueryData(collectionListKey, { items: [], total: 0 })
    queryClient.setQueryData(collectionDetailKey, { id: 'collection-1' })

    await invalidatePlaceImportResultQueries(queryClient, operationWithTarget)

    expect(
      queryClient.getQueryCache().find({ queryKey: collectionListKey })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: collectionDetailKey })?.state
        .isInvalidated,
    ).toBe(true)
  })
})
