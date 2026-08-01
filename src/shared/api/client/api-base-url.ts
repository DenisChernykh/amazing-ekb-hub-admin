import { publicEnv } from '@/shared/config'

/**
 * Возвращает общий base URL backend API для HTTP-клиента и browser API.
 */
export const getApiBaseUrl = () => publicEnv.VITE_API_BASE_URL

/**
 * Соединяет API origin с versioned endpoint path.
 *
 * @remarks Версия API остаётся частью `path`; `baseUrl` обозначает только
 * same-origin root или абсолютный HTTP(S) origin.
 */
export const joinApiUrl = (baseUrl: string, path: string) => {
  if (!path.startsWith('/')) {
    throw new Error('API path must start with /.')
  }

  return baseUrl === '/' ? path : `${baseUrl}${path}`
}

/**
 * Собирает URL backend API из общего API origin и versioned endpoint path.
 *
 * @remarks Нужен для browser API вроде `EventSource`, которые не используют
 * Axios `baseURL`. Не добавляет версию API: каждый caller передаёт полный path.
 */
export const buildApiUrl = (path: string) => joinApiUrl(getApiBaseUrl(), path)
