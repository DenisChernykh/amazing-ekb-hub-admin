import type { CurrentUserResponseDto } from '@/shared/api'
import { createContext, useContext } from 'react'

/**
 * Context текущего backend-пользователя внутри защищенной части приложения.
 */
export const CurrentUserContext = createContext<CurrentUserResponseDto | null>(
  null,
)

/**
 * Возвращает текущего пользователя из защищенного session context.
 */
export function useCurrentUser() {
  const user = useContext(CurrentUserContext)

  if (!user) {
    throw new Error('useCurrentUser must be used inside RequireAuth')
  }

  return user
}
