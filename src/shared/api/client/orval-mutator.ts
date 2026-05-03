import type { AxiosRequestConfig } from 'axios'
import { apiClient } from './api-client'
import type { ApiClientError } from './api-error'

/**
 * Единый error type, который Orval подставляет в generated React Query hooks.
 */
export type ErrorType<ErrorData> = ErrorData extends unknown
  ? ApiClientError
  : never

/**
 * Тип request body, который Orval передает в custom mutator без дополнительной трансформации.
 */
export type BodyType<BodyData> = BodyData

/**
 * Custom mutator Orval, который отправляет запросы через общий cookie-only Axios client.
 */
export const apiMutator = async <ResponseData>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<ResponseData> => {
  const response = await apiClient.request<ResponseData>({
    ...config,
    ...options,
    headers: {
      ...config.headers,
      ...options?.headers,
    },
  })

  return response.data
}
