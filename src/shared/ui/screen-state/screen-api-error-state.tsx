import { normalizeApiError } from '@/shared/api/client/api-error'
import type { ReactNode } from 'react'
import { ScreenResultState } from './screen-result-state'
import type { ScreenStateAction } from './screen-state-action'

/**
 * Props API-aware screen error state.
 */
export type ScreenApiErrorStateProps = {
  error: unknown
  errorTitle?: string
  forbiddenAction?: ScreenStateAction
  forbiddenSubTitle?: ReactNode
  forbiddenTitle?: string
  notFoundAction?: ScreenStateAction
  notFoundSubTitle?: ReactNode
  notFoundTitle?: string
  retryAction?: ScreenStateAction
}

/**
 * Преобразует normalized API errors в стандартизированные screen states.
 */
export function ScreenApiErrorState({
  error,
  errorTitle = 'Не удалось загрузить данные',
  forbiddenAction,
  forbiddenSubTitle = 'У вашей учетной записи нет доступа к этому разделу.',
  forbiddenTitle = 'Доступ запрещен',
  notFoundAction,
  notFoundSubTitle = 'Запрошенный раздел или ресурс не найден.',
  notFoundTitle = 'Не найдено',
  retryAction,
}: ScreenApiErrorStateProps) {
  const apiError = normalizeApiError(error)

  if (apiError.kind === 'permission') {
    return (
      <ScreenResultState
        primaryAction={forbiddenAction}
        status="403"
        subTitle={forbiddenSubTitle}
        title={forbiddenTitle}
      />
    )
  }

  if (apiError.kind === 'not-found') {
    return (
      <ScreenResultState
        primaryAction={notFoundAction}
        status="404"
        subTitle={notFoundSubTitle}
        title={notFoundTitle}
      />
    )
  }

  return (
    <ScreenResultState
      primaryAction={retryAction}
      status="error"
      subTitle={apiError.message}
      title={errorTitle}
    />
  )
}
