import {
  invalidateImportRunQueries,
  syncImportRunQueryCache,
} from '@/entities/import-run/model/import-run-cache'
import type { ApiClientError } from '@/shared/api/client/api-error'
import { getApiErrorStatus } from '@/shared/api/client/api-error'
import {
  createContentSource,
  getListAdminMaterialLibraryQueryKey,
  getListContentSourcesQueryKey,
  importTelegramChannel,
  updateContentSource,
  updateContentSourceStatus,
} from '@/shared/api/generated/admin/admin'
import type {
  ContentSource,
  ContentSourceStatus,
  CreateContentSourceRequest,
  ImportRun,
  UpdateContentSourceRequest,
} from '@/shared/api/generated/model'
import type { QueryClient } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Callback-и для создания content source через entity bridge.
 */
export type CreateContentSourceMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (contentSource: ContentSource) => Promise<void> | void
}

/**
 * Callback-и для редактирования content source через entity bridge.
 */
export type UpdateContentSourceMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (contentSource: ContentSource) => Promise<void> | void
}

/**
 * Callback-и для переключения статуса content source через entity bridge.
 */
export type UpdateContentSourceStatusMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (contentSource: ContentSource) => Promise<void> | void
}

/**
 * Callback-и для запуска Telegram import через entity bridge.
 */
export type ImportTelegramSourceMutationOptions = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (importRun: ImportRun) => Promise<void> | void
}

/**
 * Переменные редактирования content source через entity bridge.
 */
export type UpdateContentSourceMutationVariables = {
  data: UpdateContentSourceRequest
  sourceId: string
}

/**
 * Переменные переключения статуса content source через entity bridge.
 */
export type UpdateContentSourceStatusMutationVariables = {
  sourceId: string
  status: ContentSourceStatus
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
    queryKey: getListContentSourcesQueryKey(),
  })
}

const invalidateMaterialLibraryQueries = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    queryKey: getListAdminMaterialLibraryQueryKey(),
  })
}

const invalidateImportDependencies = (queryClient: QueryClient) => {
  return Promise.all([
    invalidateContentSourceQueries(queryClient),
    invalidateImportRunQueries(queryClient),
    invalidateMaterialLibraryQueries(queryClient),
  ])
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

  return useMutation<ContentSource, ApiClientError, CreateContentSourceRequest>(
    {
      mutationFn: (data) => createContentSource(data),
      onError: (error) => {
        options?.onError?.(error)
      },
      onSuccess: async (contentSource) => {
        await invalidateContentSourceQueries(queryClient)
        await options?.onSuccess?.(contentSource)
      },
    },
  )
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
    ContentSource,
    ApiClientError,
    UpdateContentSourceMutationVariables
  >({
    mutationFn: ({ data, sourceId }) => updateContentSource({ sourceId }, data),
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
    ContentSource,
    ApiClientError,
    UpdateContentSourceStatusMutationVariables
  >({
    mutationFn: ({ sourceId, status }) =>
      updateContentSourceStatus({ sourceId }, { status }),
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
 * @remarks После успеха сразу синхронизирует returned `ImportRun` в cache,
 * затем инвалидирует sources, import runs и material library. `409` не считается
 * фатальным состоянием UX: backend сообщает, что активный import уже существует.
 */
export function useImportTelegramSourceMutation(
  options?: ImportTelegramSourceMutationOptions,
) {
  const queryClient = useQueryClient()

  return useMutation<
    ImportRun,
    ApiClientError,
    ImportTelegramSourceMutationVariables
  >({
    mutationFn: ({ sourceId }) => importTelegramChannel({ sourceId }),
    onError: async (error) => {
      if (getApiErrorStatus(error) === 409) {
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
