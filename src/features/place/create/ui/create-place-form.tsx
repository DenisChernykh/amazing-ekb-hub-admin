import { useCreatePlaceMutation } from '@/entities/place/model/place-mutations'
import {
  toCreatePlaceRequest,
  type PlaceFormValues,
} from '@/features/place/form/model/place-form'
import { PlaceFormErrorAlert } from '@/features/place/form/ui/place-form-error-alert'
import { PlaceFormFields } from '@/features/place/form/ui/place-form-fields'
import { normalizeApiError } from '@/shared/api/client/api-error'
import { App as AntdApp, Button, Flex, Form } from 'antd'
import { useState } from 'react'

type CreatePlaceFormProps = {
  onCancel: () => void
  onCreated: () => void
}

/**
 * Ant Design форма создания места через entity-level admin mutation.
 *
 * @remarks Требует AntD `App` provider для сообщений об успехе и ошибках.
 */
export function CreatePlaceForm({ onCancel, onCreated }: CreatePlaceFormProps) {
  const { message } = AntdApp.useApp()
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const createPlaceMutation = useCreatePlaceMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: () => {
      setErrorMessages([])
      void message.success('Место создано')
      onCreated()
    },
  })

  const handleFinish = (values: PlaceFormValues) => {
    setErrorMessages([])
    createPlaceMutation.mutate({
      data: toCreatePlaceRequest(values),
    })
  }

  return (
    <Form<PlaceFormValues>
      layout="vertical"
      name="create-place"
      onFinish={handleFinish}
      requiredMark={false}
    >
      {Boolean(errorMessages.length) && (
        <Form.Item>
          <PlaceFormErrorAlert
            messages={errorMessages}
            title="Не удалось создать место"
          />
        </Form.Item>
      )}

      <PlaceFormFields disabled={createPlaceMutation.isPending} />

      <Flex gap={8} justify="end" wrap>
        <Button disabled={createPlaceMutation.isPending} onClick={onCancel}>
          Отмена
        </Button>
        <Button
          aria-label="Создать"
          htmlType="submit"
          loading={createPlaceMutation.isPending}
          type="primary"
        >
          Создать
        </Button>
      </Flex>
    </Form>
  )
}
