import { useUpdatePlaceMutation } from '@/entities/place/model/place-mutations'
import {
  getPlaceFormInitialValues,
  hasPlaceFormChanges,
  toUpdatePlaceRequest,
  type PlaceFormValues,
} from '@/features/place/form/model/place-form'
import { editPlaceFormSchema } from '@/features/place/form/model/place-form-schema'
import { PlaceFormErrorAlert } from '@/features/place/form/ui/place-form-error-alert'
import { PlaceFormFields } from '@/features/place/form/ui/place-form-fields'
import type {
  PlaceDetailResponseDto,
  PlaceSummaryResponseDto,
} from '@/shared/api'
import { normalizeApiError } from '@/shared/api/client/api-error'
import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { App as AntdApp, Button, Flex, Form } from 'antd'
import { useEffect, useState } from 'react'
import { FormProvider, useWatch } from 'react-hook-form'

/**
 * Props формы редактирования места.
 */
export type EditPlaceFormProps = {
  onCancel: () => void
  onDirtyChange?: (isDirty: boolean) => void
  onUpdated: (place: PlaceSummaryResponseDto) => void
  place: PlaceDetailResponseDto
}

/**
 * Ant Design форма редактирования места через entity-level admin mutation.
 *
 * @remarks Effect синхронизирует вычисленный RHF dirty-state с navigation blocker
 * владеющего widget. Вычисление во время render не может безопасно вызвать внешний
 * callback; зависимости effect ограничены callback и нормализованным boolean.
 * Cleanup не нужен: form и widget размонтируются вместе, а reset и успешное
 * сохранение публикуют `false`.
 */
export function EditPlaceForm({
  onCancel,
  onDirtyChange,
  onUpdated,
  place,
}: EditPlaceFormProps) {
  const { message } = AntdApp.useApp()
  const initialValues = getPlaceFormInitialValues(place)
  const form = useZodForm(editPlaceFormSchema, {
    defaultValues: initialValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const values = useWatch({
    control: form.control,
    compute: (currentValues) => currentValues,
  })
  const isDirty = hasPlaceFormChanges(values, initialValues)

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const updatePlaceMutation = useUpdatePlaceMutation({
    onError: (error) => {
      const apiError = normalizeApiError(error)
      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    },
    onSuccess: (updatedPlace) => {
      setErrorMessages([])
      form.reset(initialValues)
      onDirtyChange?.(false)
      void message.success('Место обновлено')
      onUpdated(updatedPlace)
    },
  })

  const handleReset = () => {
    form.reset(initialValues)
    setErrorMessages([])
  }

  const handleFinish = (values: PlaceFormValues) => {
    const data = toUpdatePlaceRequest(values, initialValues)

    if (!Object.keys(data).length) {
      onDirtyChange?.(false)
      return
    }

    setErrorMessages([])
    updatePlaceMutation.mutate({
      data,
      pathParams: { placeId: place.id },
    })
  }

  return (
    <FormProvider {...form}>
      <form
        name="edit-place"
        noValidate
        onSubmit={form.handleSubmit(handleFinish)}
      >
        {Boolean(errorMessages.length) && (
          <Form.Item layout="vertical">
            <PlaceFormErrorAlert
              messages={errorMessages}
              title="Не удалось обновить место"
            />
          </Form.Item>
        )}

        <PlaceFormFields
          control={form.control}
          disabled={updatePlaceMutation.isPending}
          showSlug
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
            disabled={!isDirty || updatePlaceMutation.isPending}
            htmlType="submit"
            loading={updatePlaceMutation.isPending}
            type="primary"
          >
            Сохранить
          </Button>
        </Flex>
      </form>
    </FormProvider>
  )
}
