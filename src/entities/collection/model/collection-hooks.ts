import type {
  AdminCollectionDetailResponseDto,
  AdminCollectionListResponseDto,
  ApiClientError,
} from '@/shared/api'
import {
  adminCollectionsGet,
  adminCollectionsList,
  getAdminCollectionsGetQueryKey,
  getAdminCollectionsListQueryKey,
} from '@/shared/api'
import { useQuery } from '@tanstack/react-query'

/** Загружает административный список подборок в серверном порядке. */
export function useCollectionsQuery() {
  return useQuery<AdminCollectionListResponseDto, ApiClientError>({
    queryFn: ({ signal }) => adminCollectionsList(undefined, signal),
    queryKey: getAdminCollectionsListQueryKey(),
  })
}

/** Загружает detail подборки, включая упорядоченный список мест. */
export function useCollectionDetailQuery(collectionId: string) {
  return useQuery<AdminCollectionDetailResponseDto, ApiClientError>({
    enabled: Boolean(collectionId),
    queryFn: ({ signal }) =>
      adminCollectionsGet({ collectionId }, undefined, signal),
    queryKey: getAdminCollectionsGetQueryKey({ collectionId }),
  })
}
