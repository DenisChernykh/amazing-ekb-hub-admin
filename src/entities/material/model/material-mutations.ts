import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  getGetAdminPlaceDetailQueryKey,
  getListAdminPlaceMaterialsQueryKey,
  useCreatePlaceMaterial,
  useUpdateMaterial,
} from '@/shared/api/generated/admin/admin'
import type {
  CreateMaterialRequest,
  Material,
  UpdateMaterialRequest,
} from '@/shared/api/generated/model'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Callback-и для создания материала через entity bridge.
 */
export type CreatePlaceMaterialMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (material: Material) => Promise<void> | void
}

/**
 * Callback-и для редактирования материала через entity bridge.
 */
export type UpdateMaterialMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (material: Material) => Promise<void> | void
}

/**
 * Переменные создания материала места через entity bridge.
 */
export type CreatePlaceMaterialMutationVariables = {
  data: CreateMaterialRequest
  pathParams: {
    placeId: string
  }
}

/**
 * Переменные редактирования материала через entity bridge.
 *
 * @remarks `placeId` не нужен generated `PATCH /admin/materials/{materialId}`,
 * но нужен entity bridge для инвалидации списка материалов и admin detail места.
 */
export type UpdateMaterialMutationVariables = {
  data: UpdateMaterialRequest
  materialId: string
  placeId: string
}

/**
 * Инвалидирует bounded список материалов места.
 */
export const invalidatePlaceMaterialsListQuery = (
  queryClient: QueryClient,
  placeId: string,
) => {
  return queryClient.invalidateQueries({
    queryKey: getListAdminPlaceMaterialsQueryKey({ placeId }),
  })
}

const invalidateAdminPlaceDetailQuery = (
  queryClient: QueryClient,
  placeId: string,
) => {
  return queryClient.invalidateQueries({
    queryKey: getGetAdminPlaceDetailQueryKey({ placeId }),
  })
}

const invalidateMaterialDependencies = (
  queryClient: QueryClient,
  placeId: string,
) => {
  return Promise.all([
    invalidatePlaceMaterialsListQuery(queryClient, placeId),
    invalidateAdminPlaceDetailQuery(queryClient, placeId),
  ])
}

/**
 * Создает материал места через admin API и обновляет материалы/detail кеши.
 *
 * @remarks UI получает только entity-level hook и не импортирует generated admin hooks напрямую.
 */
export function useCreatePlaceMaterialMutation(
  options?: CreatePlaceMaterialMutationOptions,
) {
  const queryClient = useQueryClient()

  return useCreatePlaceMaterial<ApiClientError>({
    mutation: {
      onError: options?.onError,
      onSuccess: async (material, variables) => {
        await invalidateMaterialDependencies(
          queryClient,
          variables.pathParams.placeId,
        )
        await options?.onSuccess?.(material)
      },
    },
  })
}

/**
 * Редактирует материал через admin API и обновляет материалы/detail кеши.
 *
 * @remarks Generated update endpoint принимает только `materialId`; wrapper
 * оставляет `placeId` в публичном API hook-а для точечной инвалидации.
 */
export function useUpdateMaterialMutation(
  options?: UpdateMaterialMutationOptions,
) {
  const queryClient = useQueryClient()
  const mutation = useUpdateMaterial<ApiClientError>({
    mutation: {
      onError: options?.onError,
    },
  })

  return {
    ...mutation,
    mutate: (variables: UpdateMaterialMutationVariables) => {
      mutation.mutate(
        {
          data: variables.data,
          pathParams: { materialId: variables.materialId },
        },
        {
          onSuccess: async (material) => {
            await invalidateMaterialDependencies(queryClient, variables.placeId)
            await options?.onSuccess?.(material)
          },
        },
      )
    },
    mutateAsync: async (variables: UpdateMaterialMutationVariables) => {
      const material = await mutation.mutateAsync({
        data: variables.data,
        pathParams: { materialId: variables.materialId },
      })

      await invalidateMaterialDependencies(queryClient, variables.placeId)
      await options?.onSuccess?.(material)

      return material
    },
  }
}
