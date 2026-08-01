import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { clearBulkModerationDraftSelection } from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { authLogin, setCsrfToken, type LoginRequestDto } from '@/shared/api'
import { sanitizeReturnTo } from '@/shared/routes'

/**
 * Выполняет вход и заменяет маршрут безопасным `returnTo`.
 *
 * @remarks Требует Router context и `QueryClientProvider`. После успешного
 * login сохраняет выданный CSRF-токен, очищает feature-owned bulk moderation
 * draft и не выполняет дополнительный `/auth/me`. Credential 401 остаётся
 * локальной ошибкой формы и не запускает app-level auth-loss boundary.
 *
 * @returns React Query mutation для выполнения login-запроса.
 */
export function useLogin(returnTo: string | null) {
  const navigate = useNavigate()

  return useMutation({
    meta: { authenticationErrorHandling: 'local' },
    mutationFn: async (credentials: LoginRequestDto) => {
      const response = await authLogin(credentials)
      setCsrfToken(response.csrfToken)

      return response
    },
    onSuccess: () => {
      clearBulkModerationDraftSelection()
      navigate(sanitizeReturnTo(returnTo), { replace: true })
    },
  })
}
