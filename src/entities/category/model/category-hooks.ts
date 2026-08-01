import type { ApiClientError, PlaceCategoryListResponseDto } from '@/shared/api'
import {
  adminCategoriesList,
  getAdminCategoriesListQueryKey,
} from '@/shared/api'
import { useQuery } from '@tanstack/react-query'

/**
 * Загружает административный список категорий мест.
 *
 * @remarks Использует generated fetcher и query key внутри entity-level hook,
 * чтобы UI не импортировал transport-слой напрямую.
 */
export function usePlaceCategoriesQuery() {
  return useQuery<PlaceCategoryListResponseDto, ApiClientError>({
    queryFn: ({ signal }) => adminCategoriesList(undefined, signal),
    queryKey: getAdminCategoriesListQueryKey(),
  })
}
