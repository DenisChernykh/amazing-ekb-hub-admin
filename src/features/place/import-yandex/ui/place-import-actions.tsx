import {
  useCancelPlaceImportMutation,
  useConfirmPlaceImportMutation,
} from '@/entities/place-import/model/place-import-mutations'
import type { PlaceImportOperationResponseDto } from '@/shared/api'
import { isProblemCode } from '@/shared/api/client/api-errors'
import { getApiErrorPresentation } from '@/shared/api/presentation/api-error-presentation'
import { Alert, App as AntdApp, Button, Flex, Modal } from 'antd'
import { useState } from 'react'

/** Confirm/cancel действия для активной operation. */
export function PlaceImportActions({
  isConfirmDisabled = false,
  operation,
}: {
  isConfirmDisabled?: boolean
  operation: PlaceImportOperationResponseDto
}) {
  const { message } = AntdApp.useApp()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const handleError = (error: unknown) => {
    const nextErrorMessage = isProblemCode(
      error,
      'PLACE_IMPORT_PREVIEW_EXPIRED',
    )
      ? 'Срок действия preview истёк. Запустите импорт заново.'
      : isProblemCode(error, 'PLACE_IMPORT_PREVIEW_NOT_READY')
        ? 'Preview ещё не готов. Дождитесь завершения обработки.'
        : getApiErrorPresentation(error).message
    setErrorMessage(nextErrorMessage)
    void message.error(nextErrorMessage)
  }
  const confirmMutation = useConfirmPlaceImportMutation({
    onError: handleError,
    onSuccess: (completedOperation) => {
      setIsConfirmOpen(false)
      void message.success(
        completedOperation.outcome === 'already_exists'
          ? 'Открываем существующее место'
          : 'Место создано скрытым',
      )
    },
  })
  const cancelMutation = useCancelPlaceImportMutation({
    onError: handleError,
    onSuccess: () => void message.success('Импорт отменён'),
  })
  const canCancel = [
    'queued',
    'parsing',
    'awaiting_captcha',
    'preview_ready',
  ].includes(operation.status)
  const isMutationPending =
    confirmMutation.isPending || cancelMutation.isPending

  return (
    <>
      {errorMessage && <Alert showIcon title={errorMessage} type="error" />}
      <Flex gap={8} justify="end" wrap>
        {canCancel && (
          <Button
            danger
            disabled={confirmMutation.isPending}
            loading={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate(operation.id)}
          >
            Отменить импорт
          </Button>
        )}
        {operation.status === 'preview_ready' && (
          <Button
            disabled={isConfirmDisabled || cancelMutation.isPending}
            onClick={() => setIsConfirmOpen(true)}
            type="primary"
          >
            Создать скрытое место
          </Button>
        )}
      </Flex>

      <Modal
        cancelButtonProps={{ disabled: isMutationPending }}
        cancelText="Вернуться к preview"
        closable={!isMutationPending}
        confirmLoading={confirmMutation.isPending}
        okText="Создать место"
        okButtonProps={{
          disabled: isConfirmDisabled || cancelMutation.isPending,
        }}
        mask={{ closable: !isMutationPending }}
        onCancel={() => {
          if (!isMutationPending) setIsConfirmOpen(false)
        }}
        onOk={() => {
          if (!isMutationPending && !isConfirmDisabled) {
            confirmMutation.mutate(operation.id)
          }
        }}
        open={isConfirmOpen}
        title="Подтвердить создание места?"
      >
        Backend применит показанный preview без изменений. Место будет создано
        скрытым; публикация выполняется отдельно в его карточке.
      </Modal>
    </>
  )
}
