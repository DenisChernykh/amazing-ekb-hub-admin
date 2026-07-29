import {
  getActivePlaceImportConflictOperationId,
  useStartPlaceImportMutation,
} from '@/entities/place-import/model/place-import-mutations'
import {
  placeImportStartSchema,
  type PlaceImportStartValues,
} from '@/features/place/import-yandex/model/place-import-start-schema'
import { normalizeApiError } from '@/shared/api/client/api-error'
import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { RhfFormItem } from '@/shared/ui/form/rhf-form-item'
import { ImportOutlined } from '@ant-design/icons'
import { Alert, Button, Input, Space, Typography } from 'antd'
import { useState } from 'react'
import { FormProvider } from 'react-hook-form'

type PlaceImportStartFormProps = {
  onStarted: (operationId: string) => void
}

/** Форма запуска импорта одной карточки Яндекс Карт. */
export function PlaceImportStartForm({ onStarted }: PlaceImportStartFormProps) {
  const form = useZodForm(placeImportStartSchema, {
    defaultValues: { url: '' },
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const mutation = useStartPlaceImportMutation({
    onError: (error) => {
      const activeOperationId = getActivePlaceImportConflictOperationId(error)

      if (activeOperationId) {
        onStarted(activeOperationId)
        return
      }

      setErrorMessage(normalizeApiError(error).message)
    },
    onSuccess: (operation) => onStarted(operation.id),
  })

  const handleSubmit = ({ url }: PlaceImportStartValues) => {
    setErrorMessage(null)
    mutation.mutate({ url })
  }

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
        <Typography.Paragraph type="secondary">
          Вставьте ссылку на одну карточку организации. Backend проверит адрес,
          подготовит read-only preview и создаст место только после
          подтверждения.
        </Typography.Paragraph>

        {Boolean(errorMessage) && (
          <Alert showIcon title={errorMessage} type="error" />
        )}

        <RhfFormItem
          control={form.control}
          label="Ссылка Яндекс Карт"
          name="url"
          required
        >
          {(field, controlProps) => (
            <Input
              aria-describedby={controlProps['aria-describedby']}
              aria-invalid={controlProps['aria-invalid']}
              autoComplete="url"
              id={controlProps.id}
              maxLength={2048}
              onBlur={field.onBlur}
              onChange={field.onChange}
              placeholder="https://yandex.ru/maps/org/..."
              ref={(input) => field.ref(input?.input ?? null)}
              status={controlProps.status}
              type="url"
              value={field.value}
            />
          )}
        </RhfFormItem>

        <Space>
          <Button
            htmlType="submit"
            icon={<ImportOutlined aria-hidden="true" />}
            loading={mutation.isPending}
            type="primary"
          >
            Начать импорт
          </Button>
        </Space>
      </form>
    </FormProvider>
  )
}
