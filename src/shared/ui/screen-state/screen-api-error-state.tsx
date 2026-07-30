import { isProblemCode, type ProblemCode } from '@/shared/api/client/api-errors'
import { getApiErrorPresentation } from '@/shared/api/presentation/api-error-presentation'
import { Space, Typography } from 'antd'
import type { ReactNode } from 'react'
import { ScreenResultState } from './screen-result-state'
import type { ScreenStateAction } from './screen-state-action'

const notFoundProblemCodes: readonly ProblemCode[] = [
  'CATEGORY_NOT_FOUND',
  'CONTENT_SOURCE_NOT_FOUND',
  'IMPORT_CONTENT_SOURCE_NOT_FOUND',
  'IMPORT_RUN_NOT_FOUND',
  'MATERIAL_NOT_FOUND',
  'MATERIAL_PLACE_NOT_FOUND',
  'NOT_FOUND',
  'PINNED_MATERIAL_NOT_FOUND',
  'PLACE_CATEGORY_NOT_FOUND',
  'PLACE_IMPORT_NOT_FOUND',
  'PLACE_MATERIAL_LINK_NOT_FOUND',
  'PLACE_NOT_FOUND',
]

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
  const presentation = getApiErrorPresentation(error)

  if (isProblemCode(error, 'AUTHORIZATION_DENIED')) {
    return (
      <ScreenResultState
        primaryAction={forbiddenAction}
        status="403"
        subTitle={forbiddenSubTitle}
        title={forbiddenTitle}
      />
    )
  }

  if (notFoundProblemCodes.some((code) => isProblemCode(error, code))) {
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
      subTitle={
        <Space direction="vertical" size={0}>
          <Typography.Text>{presentation.message}</Typography.Text>
          {Boolean(presentation.requestId) && (
            <Typography.Text type="secondary">
              ID запроса: {presentation.requestId}
            </Typography.Text>
          )}
        </Space>
      }
      title={errorTitle}
    />
  )
}
