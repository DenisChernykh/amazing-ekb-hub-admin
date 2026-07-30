import { useUpdateContentSourceStatusMutation } from '@/entities/content-source/model/content-source-mutations'
import type { ContentSourceResponseDto } from '@/shared/api'
import { isProblemCode } from '@/shared/api/client/api-errors'
import { getApiErrorPresentation } from '@/shared/api/presentation/api-error-presentation'
import { CheckOutlined, StopOutlined } from '@ant-design/icons'
import { Alert, App as AntdApp, Button, Flex } from 'antd'
import { useState } from 'react'

/**
 * Props actions переключения статуса content source.
 */
export type ContentSourceStatusActionsProps = {
  contentSource: ContentSourceResponseDto
}

/**
 * Рендерит enable/disable action для content source.
 *
 * @remarks Требует AntD `App` provider; меняет статус через entity mutation и показывает локальную ошибку для retry.
 */
export function ContentSourceStatusActions({
  contentSource,
}: ContentSourceStatusActionsProps) {
  const { message } = AntdApp.useApp()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const updateStatusMutation = useUpdateContentSourceStatusMutation()
  const nextStatus = contentSource.status === 'active' ? 'disabled' : 'active'
  const label = contentSource.status === 'active' ? 'Отключить' : 'Включить'
  const successMessage =
    nextStatus === 'active' ? 'Источник включен' : 'Источник отключен'

  const handleClick = () => {
    setErrorMessage(null)
    updateStatusMutation.mutate(
      {
        sourceId: contentSource.id,
        status: nextStatus,
      },
      {
        onError: (error) => {
          const presentation = getApiErrorPresentation(error)
          const errorMessage = isProblemCode(error, 'CONTENT_SOURCE_NOT_FOUND')
            ? 'Источник не найден.'
            : presentation.message
          setErrorMessage(errorMessage)
          void message.error(errorMessage)
        },
        onSuccess: () => {
          setErrorMessage(null)
          void message.success(successMessage)
        },
      },
    )
  }

  return (
    <Flex gap={8} vertical>
      <Button
        disabled={updateStatusMutation.isPending}
        icon={
          nextStatus === 'active' ? (
            <CheckOutlined aria-hidden="true" />
          ) : (
            <StopOutlined aria-hidden="true" />
          )
        }
        onClick={handleClick}
        size="small"
      >
        {label}
      </Button>

      {errorMessage && <Alert message={errorMessage} showIcon type="error" />}
    </Flex>
  )
}
