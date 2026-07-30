import { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'

import type { ApiClientError } from './api-error'
import { normalizeApiError } from './api-error'
import { API_AXIOS_INSTANCE } from './axios-client'

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

const operationalHealthPaths = new Set(['/health/ready', '/health/startup'])

function acceptsOperationalHealthUnavailable(
  config: AxiosRequestConfig,
  status: number,
) {
  return (
    status === 503 &&
    config.method?.toUpperCase() === 'GET' &&
    config.url !== undefined &&
    operationalHealthPaths.has(config.url)
  )
}

function getResponseMediaType(response: AxiosResponse<unknown>) {
  return String(response.headers['content-type'] ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase()
}

/**
 * Выполняет запрос с нормализацией ошибок и обработкой operational health endpoint'ов.
 *
 * @remarks Объединяет config и options без потери headers. Для readiness/startup
 * endpoints принимает JSON-ответ `503` как operational status, а все остальные
 * ошибки переводит через текущий `normalizeApiError` до typed-error cutover.
 *
 * @returns Данные успешного API-ответа с типом, заданным сгенерированным клиентом.
 */
export const apiMutator = async <ResponseData>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<ResponseData> => {
  try {
    const requestConfig: AxiosRequestConfig = {
      ...config,
      ...options,
      headers: {
        ...config.headers,
        ...options?.headers,
      },
    }
    const acceptsOperationalHealthResponse =
      requestConfig.validateStatus === undefined
    const response = await API_AXIOS_INSTANCE.request<ResponseData>({
      ...requestConfig,
      validateStatus:
        requestConfig.validateStatus === undefined
          ? (status) =>
              (status >= 200 && status < 300) ||
              acceptsOperationalHealthUnavailable(requestConfig, status)
          : requestConfig.validateStatus,
    })
    if (
      acceptsOperationalHealthResponse &&
      acceptsOperationalHealthUnavailable(requestConfig, response.status) &&
      getResponseMediaType(response) !== 'application/json'
    ) {
      throw new AxiosError(
        `Request failed with status code ${response.status}`,
        'ERR_BAD_RESPONSE',
        response.config,
        response.request,
        response,
      )
    }

    return response.data
  } catch (error) {
    throw normalizeApiError(error)
  }
}
