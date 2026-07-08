import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  getListAdminPlaceCategoriesQueryKey,
  listAdminPlaceCategories,
} from '@/shared/api/generated/admin/admin'
import type { AdminPlaceCategoryListResponse } from '@/shared/api/generated/operation'
import { useQuery } from '@tanstack/react-query'

/**
 * Загружает административный список категорий мест.
 *
 * @remarks Использует generated fetcher и query key внутри entity-level hook,
 * чтобы UI не импортировал transport-слой напрямую.
 */
export function usePlaceCategoriesQuery() {
  return useQuery<AdminPlaceCategoryListResponse, ApiClientError>({
    queryFn: ({ signal }) => listAdminPlaceCategories(undefined, signal),
    queryKey: getListAdminPlaceCategoriesQueryKey(),
  })
}
