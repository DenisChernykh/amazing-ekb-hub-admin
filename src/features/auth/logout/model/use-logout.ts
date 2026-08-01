import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { clearCurrentSession } from '@/entities/session'
import { clearBulkModerationDraftSelection } from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { authLogout, isProblemCode } from '@/shared/api'

/**
 * Выполняет logout и синхронизирует локальное состояние с backend-результатом.
 *
 * @remarks Требует Router context и `QueryClientProvider`. Успех и
 * `AUTHENTICATION_REQUIRED` очищают session/CSRF cache, feature-owned bulk draft
 * и заменяют маршрут на `/login`. Остальные ошибки сохраняют все локальные
 * данные и текущий маршрут для повторной попытки. Mutation помечена как
 * locally handled, чтобы global cache callback не дублировал logout cleanup.
 *
 * @returns React Query mutation для выполнения logout-запроса.
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const completeLocalLogout = () => {
    clearCurrentSession(queryClient)
    clearBulkModerationDraftSelection()
    navigate('/login', { replace: true })
  }

  return useMutation({
    meta: { authenticationErrorHandling: 'local' },
    mutationFn: () => authLogout(),
    onError: (error) => {
      if (isProblemCode(error, 'AUTHENTICATION_REQUIRED')) {
        completeLocalLogout()
      }
    },
    onSuccess: completeLocalLogout,
  })
}
