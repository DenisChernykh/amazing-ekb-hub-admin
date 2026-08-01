import type { QueryClient } from '@tanstack/react-query'
import type { DataRouter } from 'react-router'

import { clearCurrentSession } from '@/entities/session'
import { clearBulkModerationDraftSelection } from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { sanitizeReturnTo } from '@/shared/routes'

import { createAppQueryClient } from './query-client'

type AppRouterFactory = (queryClient: QueryClient) => DataRouter

/**
 * Собирает QueryClient и Data Router с единым обработчиком потери сессии.
 *
 * @remarks Глобальные ошибки product queries/mutations очищают session Query,
 * CSRF и bulk draft, затем заменяют маршрут на login с безопасным `returnTo`.
 * Router создаётся через dependency factory, поэтому runtime тестируется без
 * browser singleton и циклических импортов.
 *
 * @returns Связанные QueryClient и Data Router приложения.
 */
export function createAppRuntime(createRouter: AppRouterFactory) {
  let router: DataRouter | null = null
  let authenticationLossInProgress = false

  const queryClient = createAppQueryClient({
    onAuthenticationRequired: () => {
      if (router === null || authenticationLossInProgress) {
        return
      }

      const { pathname, search, hash } = router.state.location
      const currentTarget = `${pathname}${search}${hash}`
      const returnTo = sanitizeReturnTo(currentTarget)
      const isLoginEquivalentLocation =
        currentTarget !== '/' && returnTo === '/'

      if (!isLoginEquivalentLocation) {
        authenticationLossInProgress = true
      }

      clearCurrentSession(queryClient)
      clearBulkModerationDraftSelection()

      if (isLoginEquivalentLocation) {
        return
      }

      const loginSearch = new URLSearchParams({ returnTo }).toString()

      void router.navigate(`/login?${loginSearch}`, { replace: true }).then(
        () => {
          authenticationLossInProgress = false
        },
        () => {
          authenticationLossInProgress = false
        },
      )
    },
  })

  router = createRouter(queryClient)

  return { queryClient, router }
}
