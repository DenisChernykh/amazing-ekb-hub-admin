import { useImportTelegramSourceMutation } from '@/entities/content-source/model/content-source-mutations'
import {
  formatImportRunCounts,
  getImportRunStatusMeta,
} from '@/entities/import-run/ui/import-run-meta'
import type {
  ContentSourceResponseDto,
  ImportRunResponseDto,
} from '@/shared/api'
import { isProblemCode } from '@/shared/api/client/api-errors'
import { getApiErrorPresentation } from '@/shared/api/presentation/api-error-presentation'
import { DownloadOutlined } from '@ant-design/icons'
import { Alert, App as AntdApp, Button, Flex } from 'antd'
import { useState } from 'react'

/**
 * Props кнопки one-click Telegram import.
 *
 * @remarks `activeImportRun` приходит из durable `GET /admin/import-runs` и
 * блокирует повторный запуск после refresh, пока backend run остается активным.
 */
export type ImportTelegramSourceButtonProps = {
  activeImportRun?: ImportRunResponseDto | null
  contentSource: ContentSourceResponseDto
}

const IMPORT_ALREADY_ACTIVE_MESSAGE =
  'Импорт уже выполняется. Обновляем статус.'

/**
 * Рендерит one-click запуск Telegram import для active Telegram source.
 *
 * @remarks Не передает `limit`: backend сам ведет queued backfill lifecycle.
 * `409 Conflict` отображается как активный импорт, а не как фатальная ошибка.
 */
export function ImportTelegramSourceButton({
  activeImportRun = null,
  contentSource,
}: ImportTelegramSourceButtonProps) {
  const { message } = AntdApp.useApp()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const importMutation = useImportTelegramSourceMutation()
  const isImportDisabled = importMutation.isPending || Boolean(activeImportRun)
  const activeImportRunMeta = activeImportRun
    ? getImportRunStatusMeta(activeImportRun.status)
    : null

  if (
    contentSource.platform !== 'telegram' ||
    contentSource.status !== 'active'
  ) {
    return null
  }

  const handleClick = () => {
    setErrorMessage(null)
    setInfoMessage(null)
    importMutation.mutate(
      { sourceId: contentSource.id },
      {
        onError: (error) => {
          if (isProblemCode(error, 'ACTIVE_IMPORT_EXISTS')) {
            setInfoMessage(IMPORT_ALREADY_ACTIVE_MESSAGE)
            void message.info(IMPORT_ALREADY_ACTIVE_MESSAGE)

            return
          }

          const presentation = getApiErrorPresentation(error)
          const errorMessage = isProblemCode(
            error,
            'TELEGRAM_IMPORT_SOURCE_INVALID',
          )
            ? 'Источник не подходит для импорта Telegram.'
            : isProblemCode(error, 'TELEGRAM_IMPORT_UNAVAILABLE')
              ? 'Импорт Telegram временно недоступен.'
              : isProblemCode(error, 'CONTENT_SOURCE_NOT_FOUND')
                ? 'Источник не найден.'
                : presentation.message
          setErrorMessage(errorMessage)
          void message.error(errorMessage)
        },
        onSuccess: () => {
          setErrorMessage(null)
          setInfoMessage(null)
          void message.success('Импорт Telegram запущен')
        },
      },
    )
  }

  return (
    <Flex gap={8} vertical>
      <Button
        aria-label="Запустить импорт"
        disabled={isImportDisabled}
        icon={<DownloadOutlined aria-hidden="true" />}
        loading={importMutation.isPending}
        onClick={handleClick}
        size="small"
        type="primary"
      >
        Запустить импорт
      </Button>

      {activeImportRun !== null && activeImportRunMeta !== null && (
        <Alert
          description={formatImportRunCounts(activeImportRun)}
          message={`Импорт ${activeImportRunMeta.label.toLowerCase()}`}
          showIcon
          type="info"
        />
      )}

      {infoMessage !== null && (
        <Alert message={infoMessage} showIcon type="info" />
      )}

      {errorMessage !== null && (
        <Alert message={errorMessage} showIcon type="error" />
      )}
    </Flex>
  )
}
