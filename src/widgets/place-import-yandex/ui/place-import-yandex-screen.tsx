import { isTerminalPlaceImportStatus } from '@/entities/place-import/model/place-import-cache'
import {
  useActivePlaceImportQuery,
  usePlaceImportEvents,
  usePlaceImportOperationQuery,
} from '@/entities/place-import/model/place-import-hooks'
import { PlaceImportStatusTag } from '@/entities/place-import/ui/place-import-meta'
import { PlaceImportActions } from '@/features/place/import-yandex/ui/place-import-actions'
import { PlaceImportCaptchaPanel } from '@/features/place/import-yandex/ui/place-import-captcha-panel'
import { PlaceImportPreview } from '@/features/place/import-yandex/ui/place-import-preview'
import { PlaceImportStartForm } from '@/features/place/import-yandex/ui/place-import-start-form'
import { isProblemCode } from '@/shared/api/client/api-errors'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import {
  ScreenApiErrorState,
  ScreenLoadingState,
} from '@/shared/ui/screen-state/screen-state'
import { Alert, Card, Flex, Spin, Statistic, Tag, Typography } from 'antd'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

/** Экран запуска и URL-driven resume операции импорта места из Яндекс Карт. */
export function PlaceImportYandexScreen({
  operationId,
}: {
  operationId?: string
}) {
  if (!operationId) {
    return <PlaceImportYandexStartScreen />
  }

  return <PlaceImportYandexOperationScreen operationId={operationId} />
}

function PlaceImportYandexStartScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeQuery = useActivePlaceImportQuery(location.key)

  if (activeQuery.isPending) {
    return (
      <Flex gap={16} vertical>
        <DocumentTitle title="Импорт из Яндекс Карт" />
        <ScreenLoadingState title="Проверяем активный импорт" />
      </Flex>
    )
  }

  if (activeQuery.isSuccess) {
    return (
      <Navigate replace to={`/places/import/yandex/${activeQuery.data.id}`} />
    )
  }

  const hasNoActiveImport =
    activeQuery.isError &&
    isProblemCode(activeQuery.error, 'PLACE_IMPORT_NOT_FOUND')

  if (activeQuery.isError && !hasNoActiveImport) {
    return (
      <Flex gap={16} vertical>
        <DocumentTitle title="Импорт из Яндекс Карт" />
        <ScreenApiErrorState error={activeQuery.error} />
      </Flex>
    )
  }

  return (
    <Flex gap={16} vertical>
      <DocumentTitle title="Импорт из Яндекс Карт" />
      <Typography.Title level={2}>Импорт из Яндекс Карт</Typography.Title>
      <Card>
        <PlaceImportStartForm
          onAlreadyActive={() => {
            void activeQuery.refetch()
          }}
          onStarted={(startedOperationId) =>
            navigate(`/places/import/yandex/${startedOperationId}`)
          }
        />
      </Card>
    </Flex>
  )
}

function PlaceImportYandexOperationScreen({
  operationId,
}: {
  operationId: string
}) {
  const operationQuery = usePlaceImportOperationQuery(operationId)
  const operation = operationQuery.data
  const events = usePlaceImportEvents(operation)

  if (operationQuery.isPending) {
    return (
      <Flex gap={16} vertical>
        <DocumentTitle title="Импорт из Яндекс Карт" />
        <ScreenLoadingState title="Восстанавливаем операцию импорта" />
      </Flex>
    )
  }

  if (operationQuery.isError || !operation) {
    return (
      <Flex gap={16} vertical>
        <DocumentTitle title="Импорт из Яндекс Карт" />
        <ScreenApiErrorState
          error={operationQuery.error}
          forbiddenAction={{ label: 'На главную', to: '/' }}
          notFoundAction={{
            label: 'Начать новый импорт',
            to: '/places/import/yandex',
          }}
        />
      </Flex>
    )
  }

  if (operation.status === 'completed' && operation.resultPlaceId) {
    return <Navigate replace to={`/places/${operation.resultPlaceId}`} />
  }

  const isProcessing = ['queued', 'parsing'].includes(operation.status)
  const isTerminal = isTerminalPlaceImportStatus(operation.status)

  return (
    <Flex gap={16} vertical>
      <DocumentTitle title="Импорт из Яндекс Карт" />
      <Flex align="center" gap={12} justify="space-between" wrap>
        <Typography.Title level={2}>Импорт из Яндекс Карт</Typography.Title>
        <Flex align="center" gap={8} wrap>
          <PlaceImportStatusTag status={operation.status} />
          {events.isPollingFallback && (
            <Tag color="warning">Polling fallback</Tag>
          )}
        </Flex>
      </Flex>

      <Typography.Text type="secondary">
        Операция: <Typography.Text code>{operation.id}</Typography.Text>
      </Typography.Text>

      {events.pollingErrorMessage && (
        <Alert
          description="Повторяем запрос автоматически. Не подтверждайте preview, пока актуальный статус не восстановится."
          showIcon
          title={`Не удалось обновить статус: ${events.pollingErrorMessage}`}
          type="error"
        />
      )}

      <Card>
        <Flex gap={20} vertical>
          {isProcessing && (
            <Flex align="center" gap={12}>
              <Spin size="small" />
              <Typography.Text>
                {operation.status === 'queued'
                  ? 'Операция ожидает обработку.'
                  : 'Читаем карточку организации и проверяем данные.'}
              </Typography.Text>
            </Flex>
          )}

          {operation.status === 'awaiting_captcha' && (
            <PlaceImportCaptchaPanel operation={operation} />
          )}

          {operation.status === 'preview_ready' && (
            <>
              <PlaceImportPreview operation={operation} />
              {operation.previewExpiresAt && (
                <Statistic.Countdown
                  format="HH:mm:ss"
                  title="Preview действителен ещё"
                  value={new Date(operation.previewExpiresAt).getTime()}
                />
              )}
            </>
          )}

          {operation.error && (
            <Alert
              description={operation.error.message}
              showIcon
              title={`Импорт не завершён: ${operation.error.code}`}
              type="error"
            />
          )}

          {operation.status === 'cancelled' && (
            <Alert showIcon title="Импорт отменён" type="info" />
          )}

          {isTerminal && !operation.resultPlaceId && (
            <Link to="/places/import/yandex">Начать новый импорт</Link>
          )}

          <PlaceImportActions
            isConfirmDisabled={Boolean(events.pollingErrorMessage)}
            operation={operation}
          />
        </Flex>
      </Card>
    </Flex>
  )
}
