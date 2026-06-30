import axios, { AxiosError, type AxiosInstance } from 'axios'
import { getApiBaseUrl } from './api-base-url'
import { normalizeApiError } from './api-error'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    isAuthRefreshRetry?: boolean
  }
}

let refreshPromise: Promise<void> | null = null

const shouldSkipRefresh = (url: string | undefined) =>
  typeof url === 'string' &&
  (url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout'))

const requestRefresh = async (client: AxiosInstance) => {
  refreshPromise ??= client
    .post<void>('/auth/refresh')
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

/**
 * Cookie-only Axios transport для generated API клиента админки.
 */
export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest.isAuthRefreshRetry &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest.isAuthRefreshRetry = true

      try {
        await requestRefresh(apiClient)

        return apiClient.request(originalRequest)
      } catch (refreshError) {
        return Promise.reject(normalizeApiError(refreshError))
      }
    }

    return Promise.reject(normalizeApiError(error))
  },
)
