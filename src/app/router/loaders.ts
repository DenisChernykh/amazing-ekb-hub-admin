import { isProblemCode } from '@/shared/api'
import { sanitizeReturnTo } from '@/shared/routes'
import { redirect, type LoaderFunctionArgs } from 'react-router'

type SessionLoaderDependencies = {
  load: (signal: AbortSignal) => Promise<unknown>
  clear: () => void
}

/**
 * Создаёт loader защищённой ветки приложения.
 *
 * @remarks Всегда проверяет backend-сессию через переданный `load`. Только
 * `AUTHENTICATION_REQUIRED` очищает локальное auth-состояние и переводит на
 * login с полным безопасно закодированным `returnTo`; abort и остальные ошибки
 * остаются route errors.
 *
 * @returns React Router loader защищённого маршрута.
 */
export function createRequireSessionLoader(
  dependencies: SessionLoaderDependencies,
) {
  return async ({ request }: LoaderFunctionArgs) => {
    try {
      await dependencies.load(request.signal)
      return null
    } catch (error) {
      if (
        request.signal.aborted ||
        !isProblemCode(error, 'AUTHENTICATION_REQUIRED')
      ) {
        throw error
      }

      dependencies.clear()

      const requestUrl = new URL(request.url)
      const returnTo = `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`
      const loginSearch = new URLSearchParams({ returnTo }).toString()

      throw redirect(`/login?${loginSearch}`)
    }
  }
}

/**
 * Создаёт loader страницы входа для уже аутентифицированной сессии.
 *
 * @remarks Успешная проверка переводит на очищенный `returnTo` или `/`.
 * `AUTHENTICATION_REQUIRED` оставляет пользователя на login и не очищает
 * локальное состояние; abort и остальные ошибки передаются error element.
 *
 * @returns React Router loader публичного login-маршрута.
 */
export function createRedirectAuthenticatedLoader(
  dependencies: SessionLoaderDependencies,
) {
  return async ({ request }: LoaderFunctionArgs) => {
    try {
      await dependencies.load(request.signal)
    } catch (error) {
      if (
        !request.signal.aborted &&
        isProblemCode(error, 'AUTHENTICATION_REQUIRED')
      ) {
        return null
      }

      throw error
    }

    const requestUrl = new URL(request.url)
    const returnTo = requestUrl.searchParams.get('returnTo')

    throw redirect(sanitizeReturnTo(returnTo))
  }
}
