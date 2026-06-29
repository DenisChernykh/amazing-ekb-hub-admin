import type { ApiClientError } from '@/shared/api/client/api-error'
import {
  createPlaceMaterial,
  getGetAdminPlaceDetailQueryKey,
  getListAdminMaterialLibraryQueryKey,
  getListAdminPlaceMaterialsQueryKey,
  hidePlaceMaterialLink,
  linkPlaceMaterial,
  updateMaterial,
  updateMaterialAdminStatus,
} from '@/shared/api/generated/admin/admin'
import type {
  AdminMaterialLibraryItem,
  CreateMaterialRequest,
  Material,
  MaterialAdminStatus,
  UpdateMaterialRequest,
} from '@/shared/api/generated/model'
import type { QueryClient } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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
 * Callback-и для смены review-статуса материала через entity bridge.
 */
export type UpdateMaterialAdminStatusMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (material: AdminMaterialLibraryItem) => Promise<void> | void
}

/**
 * Callback-и для привязки библиотечного материала к месту через entity bridge.
 */
export type LinkPlaceMaterialMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (material: Material) => Promise<void> | void
}

/**
 * Callback-и для скрытия связи материала с местом через entity bridge.
 */
export type HidePlaceMaterialLinkMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: () => Promise<void> | void
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
 * Переменные смены review-статуса материала через entity bridge.
 */
export type UpdateMaterialAdminStatusMutationVariables = {
  adminStatus: MaterialAdminStatus
  materialId: string
}

/**
 * Переменные привязки существующего материала к месту через entity bridge.
 */
export type LinkPlaceMaterialMutationVariables = {
  materialId: string
  placeId: string
}

/**
 * Переменные скрытия связи материала с местом через entity bridge.
 */
export type HidePlaceMaterialLinkMutationVariables = {
  materialId: string
  placeId: string
}

/**
 * Инвалидирует все варианты списка общей библиотеки материалов.
 */
export const invalidateMaterialLibraryQueries = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    queryKey: getListAdminMaterialLibraryQueryKey(),
  })
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

const invalidateMaterialLinkDependencies = (
  queryClient: QueryClient,
  placeId: string,
) => {
  return Promise.all([
    invalidatePlaceMaterialsListQuery(queryClient, placeId),
    invalidateAdminPlaceDetailQuery(queryClient, placeId),
    invalidateMaterialLibraryQueries(queryClient),
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

  return useMutation<
    Material,
    ApiClientError,
    CreatePlaceMaterialMutationVariables
  >({
    mutationFn: ({ data, pathParams }) => createPlaceMaterial(pathParams, data),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (material, variables) => {
      await invalidateMaterialDependencies(
        queryClient,
        variables.pathParams.placeId,
      )
      await options?.onSuccess?.(material)
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

  return useMutation<Material, ApiClientError, UpdateMaterialMutationVariables>(
    {
      mutationFn: ({ data, materialId }) =>
        updateMaterial({ materialId }, data),
      onError: (error) => {
        options?.onError?.(error)
      },
      onSuccess: async (material, variables) => {
        await invalidateMaterialDependencies(queryClient, variables.placeId)
        await options?.onSuccess?.(material)
      },
    },
  )
}

/**
 * Меняет review-статус материала через admin API и обновляет кеш библиотеки.
 *
 * @remarks Wrapper скрывает generated shape `pathParams/data` и принимает плоские переменные для feature actions.
 */
export function useUpdateMaterialAdminStatusMutation(
  options?: UpdateMaterialAdminStatusMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<
    AdminMaterialLibraryItem,
    ApiClientError,
    UpdateMaterialAdminStatusMutationVariables
  >({
    mutationFn: ({ adminStatus, materialId }) =>
      updateMaterialAdminStatus({ materialId }, { adminStatus }),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (material) => {
      await invalidateMaterialLibraryQueries(queryClient)
      await options?.onSuccess?.(material)
    },
  })
}

/**
 * Привязывает существующий библиотечный материал к месту и обновляет связанные кеши.
 *
 * @remarks Wrapper скрывает generated shape `pathParams` и после успеха инвалидирует
 * admin detail места, bounded список материалов места и все варианты material library.
 */
export function useLinkPlaceMaterialMutation(
  options?: LinkPlaceMaterialMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<
    Material,
    ApiClientError,
    LinkPlaceMaterialMutationVariables
  >({
    mutationFn: ({ materialId, placeId }) =>
      linkPlaceMaterial({ materialId, placeId }),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (material, variables) => {
      await invalidateMaterialLinkDependencies(queryClient, variables.placeId)
      await options?.onSuccess?.(material)
    },
  })
}

/**
 * Скрывает активную связь материала с местом и обновляет связанные кеши.
 *
 * @remarks Материал остается в общей библиотеке; wrapper инвалидирует admin detail места,
 * bounded список материалов места и material library, где меняются linked/placeLink признаки.
 */
export function useHidePlaceMaterialLinkMutation(
  options?: HidePlaceMaterialLinkMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    ApiClientError,
    HidePlaceMaterialLinkMutationVariables
  >({
    mutationFn: ({ materialId, placeId }) =>
      hidePlaceMaterialLink({ materialId, placeId }),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (_result, variables) => {
      await invalidateMaterialLinkDependencies(queryClient, variables.placeId)
      await options?.onSuccess?.()
    },
  })
}
