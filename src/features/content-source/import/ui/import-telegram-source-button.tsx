import { useImportTelegramSourceMutation } from '@/entities/content-source/model/content-source-mutations'
import {
  formatImportRunCounts,
  getImportRunStatusMeta,
} from '@/entities/import-run/ui/import-run-meta'
import {
  getApiErrorStatus,
  normalizeApiError,
} from '@/shared/api/client/api-error'
import type { ContentSource, ImportRun } from '@/shared/api/generated/model'
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
  activeImportRun?: ImportRun | null
  contentSource: ContentSource
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
          const apiError = normalizeApiError(error)

          if (getApiErrorStatus(apiError) === 409) {
            setInfoMessage(IMPORT_ALREADY_ACTIVE_MESSAGE)
            void message.info(IMPORT_ALREADY_ACTIVE_MESSAGE)

            return
          }

          setErrorMessage(apiError.message)
          void message.error(apiError.message)
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

      {activeImportRun && activeImportRunMeta ? (
        <Alert
          description={formatImportRunCounts(activeImportRun)}
          message={`Импорт ${activeImportRunMeta.label.toLowerCase()}`}
          showIcon
          type="info"
        />
      ) : null}

      {infoMessage !== null ? (
        <Alert message={infoMessage} showIcon type="info" />
      ) : null}

      {errorMessage !== null ? (
        <Alert message={errorMessage} showIcon type="error" />
      ) : null}
    </Flex>
  )
}
