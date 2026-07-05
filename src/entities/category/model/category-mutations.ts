import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  createPlaceCategory,
  deletePlaceCategory,
  getListAdminPlaceCategoriesQueryKey,
  getListAdminPlacesQueryKey,
  updatePlaceCategory,
} from '@/shared/api/generated/admin/admin'
import type {
  AdminPlaceCategory,
  CreatePlaceCategoryRequest,
  UpdatePlaceCategoryRequest,
} from '@/shared/api/generated/model'
import type { QueryClient } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Callback-и для создания категории места через entity bridge.
 */
export type CreateCategoryMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (category: AdminPlaceCategory) => Promise<void> | void
}

/**
 * Callback-и для редактирования категории места через entity bridge.
 */
export type UpdateCategoryMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (category: AdminPlaceCategory) => Promise<void> | void
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
  data: UpdatePlaceCategoryRequest
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
    queryKey: getListAdminPlaceCategoriesQueryKey(),
  })
}

const invalidatePlacesListQueries = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    queryKey: getListAdminPlacesQueryKey(),
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
    AdminPlaceCategory,
    ApiClientError,
    CreatePlaceCategoryRequest
  >({
    mutationFn: (data) => createPlaceCategory(data),
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
 * после успеха инвалидируется список мест вместе со справочником категорий.
 */
export function useUpdateCategoryMutation(
  options?: UpdateCategoryMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<
    AdminPlaceCategory,
    ApiClientError,
    UpdateCategoryMutationVariables
  >({
    mutationFn: ({ categoryId, data }) =>
      updatePlaceCategory({ categoryId }, data),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (category) => {
      await Promise.all([
        invalidateCategoryQueries(queryClient),
        invalidatePlacesListQueries(queryClient),
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
    mutationFn: ({ categoryId }) => deletePlaceCategory({ categoryId }),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async () => {
      await invalidateCategoryQueries(queryClient)
      await options?.onSuccess?.()
    },
  })
}
