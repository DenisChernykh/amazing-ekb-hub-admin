const DEFAULT_API_BASE_URL = '/v1'

/**
 * Возвращает общий base URL backend API для HTTP-клиента и browser API.
 */
export const getApiBaseUrl = () =>
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL

/**
 * Собирает URL backend API из общего base URL и относительного path.
 *
 * @remarks Нужен для browser API вроде `EventSource`, которые не используют Axios `baseURL`.
 */
export const buildApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '')
  const normalizedPath = path.replace(/^\/+/, '')

  return `${baseUrl}/${normalizedPath}`
}
