import {
  invalidateImportRunDependencyQueries,
  invalidateImportRunQueries,
  syncImportRunQueryCache,
} from '@/entities/import-run/model/import-run-cache'
import { invalidateMaterialLibraryQueries } from '@/entities/material/model/material-mutations'
import type {
  ContentSourceResponseDto,
  ContentSourceResponseDtoStatus,
  CreateContentSourceDto,
  ImportRunResponseDto,
  UpdateContentSourceDto,
} from '@/shared/api'
import {
  adminContentSourcesCreate,
  adminContentSourcesUpdate,
  adminContentSourcesUpdateStatus,
  adminTelegramImportsEnqueue,
  getAdminContentSourcesListQueryKey,
} from '@/shared/api'
import {
  isProblemCode,
  type ApiClientError,
} from '@/shared/api/client/api-errors'
import type { QueryClient } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Callback-и для создания content source через entity bridge.
 */
export type CreateContentSourceMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (contentSource: ContentSourceResponseDto) => Promise<void> | void
}

/**
 * Callback-и для редактирования content source через entity bridge.
 */
export type UpdateContentSourceMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (contentSource: ContentSourceResponseDto) => Promise<void> | void
}

/**
 * Callback-и для переключения статуса content source через entity bridge.
 */
export type UpdateContentSourceStatusMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (contentSource: ContentSourceResponseDto) => Promise<void> | void
}

/**
 * Callback-и для запуска Telegram import через entity bridge.
 */
export type ImportTelegramSourceMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (importRun: ImportRunResponseDto) => Promise<void> | void
}

/**
 * Переменные редактирования content source через entity bridge.
 */
export type UpdateContentSourceMutationVariables = {
  data: UpdateContentSourceDto
  sourceId: string
}

/**
 * Переменные переключения статуса content source через entity bridge.
 */
export type UpdateContentSourceStatusMutationVariables = {
  sourceId: string
  status: ContentSourceResponseDtoStatus
}

/**
 * Переменные запуска Telegram import через entity bridge.
 */
export type ImportTelegramSourceMutationVariables = {
  sourceId: string
}

/**
 * Инвалидирует все варианты списка content sources.
 */
export const invalidateContentSourceQueries = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    queryKey: getAdminContentSourcesListQueryKey(),
  })
}

const invalidateImportDependencies = (queryClient: QueryClient) => {
  return invalidateImportRunDependencyQueries(queryClient)
}

/**
 * Создает content source через admin API и обновляет кеши source lists.
 *
 * @remarks UI получает только entity-level hook и не импортирует generated admin hooks напрямую.
 */
export function useCreateContentSourceMutation(
  options?: CreateContentSourceMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<
    ContentSourceResponseDto,
    ApiClientError,
    CreateContentSourceDto
  >({
    mutationFn: (data) => adminContentSourcesCreate(data),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (contentSource) => {
      await invalidateContentSourceQueries(queryClient)
      await options?.onSuccess?.(contentSource)
    },
  })
}

/**
 * Редактирует content source через admin API и обновляет кеши source lists/material library.
 *
 * @remarks Wrapper скрывает generated shape `pathParams/data` и принимает плоские переменные для feature form.
 */
export function useUpdateContentSourceMutation(
  options?: UpdateContentSourceMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<
    ContentSourceResponseDto,
    ApiClientError,
    UpdateContentSourceMutationVariables
  >({
    mutationFn: ({ data, sourceId }) =>
      adminContentSourcesUpdate({ sourceId }, data),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (contentSource) => {
      await Promise.all([
        invalidateContentSourceQueries(queryClient),
        invalidateMaterialLibraryQueries(queryClient),
      ])
      await options?.onSuccess?.(contentSource)
    },
  })
}

/**
 * Переключает статус content source через admin API и обновляет кеши source lists.
 *
 * @remarks Используется для enable/disable без удаления источника.
 */
export function useUpdateContentSourceStatusMutation(
  options?: UpdateContentSourceStatusMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<
    ContentSourceResponseDto,
    ApiClientError,
    UpdateContentSourceStatusMutationVariables
  >({
    mutationFn: ({ sourceId, status }) =>
      adminContentSourcesUpdateStatus({ sourceId }, { status }),
    onError: (error) => {
      options?.onError?.(error)
    },
    onSuccess: async (contentSource) => {
      await invalidateContentSourceQueries(queryClient)
      await options?.onSuccess?.(contentSource)
    },
  })
}

/**
 * Запускает durable one-click Telegram import для active Telegram source.
 *
 * @remarks После успеха сразу синхронизирует returned `ImportRunResponseDto` в cache,
 * затем инвалидирует sources, import runs и material library. `409` не считается
 * фатальным состоянием UX: backend сообщает, что активный import уже существует.
 */
export function useImportTelegramSourceMutation(
  options?: ImportTelegramSourceMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<
    ImportRunResponseDto,
    ApiClientError,
    ImportTelegramSourceMutationVariables
  >({
    mutationFn: ({ sourceId }) => adminTelegramImportsEnqueue({ sourceId }),
    onError: async (error) => {
      if (isProblemCode(error, 'ACTIVE_IMPORT_EXISTS')) {
        await invalidateImportRunQueries(queryClient)
      }

      options?.onError?.(error)
    },
    onSuccess: async (importRun) => {
      syncImportRunQueryCache(queryClient, importRun)
      await invalidateImportDependencies(queryClient)
      await options?.onSuccess?.(importRun)
    },
  })
}
