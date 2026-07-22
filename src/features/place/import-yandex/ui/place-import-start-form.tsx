import {
  getActivePlaceImportConflictOperationId,
  useStartPlaceImportMutation,
} from '@/entities/place-import/model/place-import-mutations'
import { normalizeApiError } from '@/shared/api/client/api-error'
import { getHttpUrlValidationError } from '@/shared/lib/url/safe-url'
import { ImportOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input, Space, Typography } from 'antd'
import { useState } from 'react'

type PlaceImportStartFormProps = {
  onStarted: (operationId: string) => void
}

/** Форма запуска импорта одной карточки Яндекс Карт. */
export function PlaceImportStartForm({ onStarted }: PlaceImportStartFormProps) {
  const [form] = Form.useForm<{ url: string }>()
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

  const handleSubmit = ({ url }: { url: string }) => {
    setErrorMessage(null)
    mutation.mutate({ url: url.trim() })
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Typography.Paragraph type="secondary">
        Вставьте ссылку на одну карточку организации. Backend проверит адрес,
        подготовит read-only preview и создаст место только после подтверждения.
      </Typography.Paragraph>

      {errorMessage && <Alert showIcon title={errorMessage} type="error" />}

      <Form.Item
        label="Ссылка Яндекс Карт"
        name="url"
        rules={[
          {
            required: true,
            message: 'Вставьте ссылку на карточку организации',
          },
          {
            validator: async (_rule, value: unknown) => {
              if (typeof value !== 'string' || !value.trim()) return
              const error = getHttpUrlValidationError(value)
              if (error) throw new Error(error)
            },
          },
        ]}
      >
        <Input
          autoComplete="url"
          maxLength={2048}
          placeholder="https://yandex.ru/maps/org/..."
          type="url"
        />
      </Form.Item>

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
    </Form>
  )
}
