import { useImportTelegramSourceMutation } from '@/entities/content-source/model/content-source-mutations'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { ContentSource } from '@/shared/api/generated/model'
import { DownloadOutlined } from '@ant-design/icons'
import { Alert, App as AntdApp, Button, Flex } from 'antd'
import { useState } from 'react'

/**
 * Props кнопки Telegram import.
 */
export type ImportTelegramSourceButtonProps = {
  contentSource: ContentSource
}

/**
 * Рендерит запуск bounded Telegram import для active Telegram source.
 *
 * @remarks Не передает `limit`: backend использует default batch size; scheduler/queue UI в admin v1 отсутствует.
 */
export function ImportTelegramSourceButton({
  contentSource,
}: ImportTelegramSourceButtonProps) {
  const { message } = AntdApp.useApp()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const importMutation = useImportTelegramSourceMutation()

  if (
    contentSource.platform !== 'telegram' ||
    contentSource.status !== 'active'
  ) {
    return null
  }

  const handleClick = () => {
    setErrorMessage(null)
    importMutation.mutate(
      { sourceId: contentSource.id },
      {
        onError: (error) => {
          const apiError = normalizeApiError(error)
          setErrorMessage(apiError.message)
          void message.error(apiError.message)
        },
        onSuccess: () => {
          setErrorMessage(null)
          void message.success('Импорт Telegram запущен')
        },
      },
    )
  }

  return (
    <Flex gap={8} vertical>
      <Button
        aria-label="Импорт Telegram"
        disabled={importMutation.isPending}
        icon={<DownloadOutlined aria-hidden="true" />}
        loading={importMutation.isPending}
        onClick={handleClick}
        size="small"
      >
        Импорт Telegram
      </Button>

      {errorMessage && <Alert message={errorMessage} showIcon type="error" />}
    </Flex>
  )
}
