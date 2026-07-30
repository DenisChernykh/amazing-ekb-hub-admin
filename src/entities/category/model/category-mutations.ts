import type {
  CreatePlaceCategoryDto,
  PlaceCategoryResponseDto,
  UpdatePlaceCategoryDto,
} from '@/shared/api'
import {
  adminCategoriesCreate,
  adminCategoriesDelete,
  adminCategoriesUpdate,
  getAdminCategoriesListQueryKey,
  getAdminPlacesListQueryKey,
} from '@/shared/api'
import type { ApiClientError } from '@/shared/api/client/api-errors'
import type { Query, QueryClient } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Callback-и для создания категории места через entity bridge.
 */
export type CreateCategoryMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (category: PlaceCategoryResponseDto) => Promise<void> | void
}

/**
 * Callback-и для редактирования категории места через entity bridge.
 */
export type UpdateCategoryMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (category: PlaceCategoryResponseDto) => Promise<void> | void
}

/**
 * Callback-и для удаления категории места через entity bridge.
 */
export type DeleteCategoryMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: () => Promise<void> | void
}

/**
 * Переменные редактирования категории места.
 */
export type UpdateCategoryMutationVariables = {
  categoryId: string
  data: UpdatePlaceCategoryDto
}

/**
 * Переменные удаления категории места.
 */
export type DeleteCategoryMutationVariables = {
  categoryId: string
}

/**
 * Инвалидирует административный список категорий мест.
 */
export const invalidateCategoryQueries = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    queryKey: getAdminCategoriesListQueryKey(),
  })
}

const invalidatePlacesListQueries = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    queryKey: getAdminPlacesListQueryKey(),
  })
}

// Category title/color are embedded into place details, whose generated keys are `/admin/places/{placeId}`.
const isAdminPlaceDetailQuery = (query: Query) => {
  const [rootKey] = query.queryKey
  const [placesListRootKey] = getAdminPlacesListQueryKey()

  return (
    typeof rootKey === 'string' &&
    typeof placesListRootKey === 'string' &&
    rootKey.startsWith(`${placesListRootKey}/`)
  )
}

const invalidateAdminPlaceDetailQueries = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    predicate: isAdminPlaceDetailQuery,
  })
}

/**
 * Создает категорию места и обновляет кеш списка категорий.
 *
 * @remarks UI получает только entity-level hook и не импортирует generated admin hooks напрямую.
 */
export function useCreateCategoryMutation(
  options?: CreateCategoryMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<
    PlaceCategoryResponseDto,
    ApiClientError,
    CreatePlaceCategoryDto
  >({
    mutationFn: (data) => adminCategoriesCreate(data),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (category) => {
      await invalidateCategoryQueries(queryClient)
      await options?.onSuccess?.(category)
    },
  })
}

/**
 * Редактирует категорию места и обновляет зависимые admin-кеши.
 *
 * @remarks Обновление названия/цвета категории меняет отображение мест, поэтому
 * после успеха инвалидируются список мест, detail-карточки и справочник категорий.
 */
export function useUpdateCategoryMutation(
  options?: UpdateCategoryMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<
    PlaceCategoryResponseDto,
    ApiClientError,
    UpdateCategoryMutationVariables
  >({
    mutationFn: ({ categoryId, data }) =>
      adminCategoriesUpdate({ categoryId }, data),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (category) => {
      await Promise.all([
        invalidateCategoryQueries(queryClient),
        invalidatePlacesListQueries(queryClient),
        invalidateAdminPlaceDetailQueries(queryClient),
      ])
      await options?.onSuccess?.(category)
    },
  })
}

/**
 * Удаляет неиспользуемую категорию места и обновляет список категорий.
 *
 * @remarks Backend возвращает `409`, если категория уже связана с местами.
 */
export function useDeleteCategoryMutation(
  options?: DeleteCategoryMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiClientError, DeleteCategoryMutationVariables>({
    mutationFn: ({ categoryId }) => adminCategoriesDelete({ categoryId }),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async () => {
      await invalidateCategoryQueries(queryClient)
      await options?.onSuccess?.()
    },
  })
}
