import type { ApiClientError } from '@/shared/api/client/api-error'
import { useListAdminMaterialLibrary } from '@/shared/api/generated/admin/admin'
import type { AdminMaterialLibraryListResponse } from '@/shared/api/generated/operation/adminMaterialLibraryListResponse'
import type { ListAdminMaterialLibraryParams } from '@/shared/api/generated/operation/listAdminMaterialLibraryParams'
import type { UseQueryOptions } from '@tanstack/react-query'

/**
 * Безопасные options для запроса общей библиотеки материалов без замены query key или query function.
 */
export type MaterialLibraryQueryOptions = Omit<
  Partial<
    UseQueryOptions<
      AdminMaterialLibraryListResponse,
      ApiClientError,
      AdminMaterialLibraryListResponse
    >
  >,
  'queryFn' | 'queryKey'
>

/**
 * Загружает административную библиотеку материалов через entity-level bridge.
 *
 * @remarks UI получает этот hook вместо generated admin hook, чтобы не зависеть от transport-слоя напрямую.
 */
export function useMaterialLibraryQuery(
  params?: ListAdminMaterialLibraryParams,
  options?: MaterialLibraryQueryOptions,
) {
  return useListAdminMaterialLibrary<
    AdminMaterialLibraryListResponse,
    ApiClientError
  >(params, {
    query: options,
  })
}
