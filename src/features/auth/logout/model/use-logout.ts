import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { clearCurrentSession } from '@/entities/session'
import { clearBulkModerationDraftSelection } from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { authLogout, isProblemCode } from '@/shared/api'

/**
 * Выполняет logout и синхронизирует локальное состояние с backend-результатом.
 *
 * @remarks Успех и `AUTHENTICATION_REQUIRED` очищают session/CSRF cache,
 * feature-owned bulk draft и заменяют маршрут на `/login`. Остальные ошибки
 * сохраняют все локальные данные и текущий маршрут для повторной попытки.
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
    mutationFn: () => authLogout(),
    onError: (error) => {
      if (isProblemCode(error, 'AUTHENTICATION_REQUIRED')) {
        completeLocalLogout()
      }
    },
    onSuccess: completeLocalLogout,
  })
}
