import { useUpdatePlaceMutation } from '@/entities/place/model/place-mutations'
import {
  getPlaceFormInitialValues,
  hasPlaceFormChanges,
  toUpdatePlaceRequest,
  type PlaceFormValues,
} from '@/features/place/form/model/place-form'
import { PlaceFormErrorAlert } from '@/features/place/form/ui/place-form-error-alert'
import { PlaceFormFields } from '@/features/place/form/ui/place-form-fields'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { PlaceDetail, PlaceSummary } from '@/shared/api/generated/model'
import { App as AntdApp, Button, Flex, Form } from 'antd'
import { useState } from 'react'

/**
 * Props формы редактирования места.
 */
export type EditPlaceFormProps = {
  onCancel: () => void
  onDirtyChange?: (isDirty: boolean) => void
  onUpdated: (place: PlaceSummary) => void
  place: PlaceDetail
}

/**
 * Ant Design форма редактирования места через entity-level admin mutation.
 *
 * @remarks Сообщает наружу dirty-state, чтобы widget-экран мог блокировать навигацию.
 */
export function EditPlaceForm({
  onCancel,
  onDirtyChange,
  onUpdated,
  place,
}: EditPlaceFormProps) {
  const { message } = AntdApp.useApp()
  const [form] = Form.useForm<PlaceFormValues>()
  const initialValues = getPlaceFormInitialValues(place)
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const updatePlaceMutation = useUpdatePlaceMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: (updatedPlace) => {
      setErrorMessages([])
      setIsDirty(false)
      onDirtyChange?.(false)
      void message.success('Место обновлено')
      onUpdated(updatedPlace)
    },
  })

  const updateDirtyState = (nextIsDirty: boolean) => {
    setIsDirty(nextIsDirty)
    onDirtyChange?.(nextIsDirty)
  }

  const handleValuesChange = () => {
    updateDirtyState(hasPlaceFormChanges(form.getFieldsValue(), initialValues))
  }

  const handleReset = () => {
    form.setFieldsValue(initialValues)
    setErrorMessages([])
    updateDirtyState(false)
  }

  const handleFinish = (values: PlaceFormValues) => {
    const data = toUpdatePlaceRequest(values, initialValues)

    if (!Object.keys(data).length) {
      updateDirtyState(false)
      return
    }

    setErrorMessages([])
    updatePlaceMutation.mutate({
      data,
      pathParams: { placeId: place.id },
    })
  }

  return (
    <Form<PlaceFormValues>
      form={form}
      initialValues={initialValues}
      layout="vertical"
      name="edit-place"
      onFinish={handleFinish}
      onValuesChange={handleValuesChange}
      requiredMark={false}
    >
      {Boolean(errorMessages.length) && (
        <Form.Item>
          <PlaceFormErrorAlert
            messages={errorMessages}
            title="Не удалось обновить место"
          />
        </Form.Item>
      )}

      <PlaceFormFields
        disabled={updatePlaceMutation.isPending}
        popularityWeightRequired
      />

      <Flex gap={8} justify="end" wrap>
        <Button disabled={updatePlaceMutation.isPending} onClick={onCancel}>
          Отмена
        </Button>
        <Button
          disabled={!isDirty || updatePlaceMutation.isPending}
          onClick={handleReset}
        >
          Вернуть исходные
        </Button>
        <Button
          aria-label="Сохранить"
          disabled={!isDirty}
          htmlType="submit"
          loading={updatePlaceMutation.isPending}
          type="primary"
        >
          Сохранить
        </Button>
      </Flex>
    </Form>
  )
}
