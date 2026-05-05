import { useCreatePlaceMutation } from '@/entities/place/model/place-mutations'
import { getPlaceCategoryOptions } from '@/entities/place/ui/place-meta'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type {
  CreatePlaceRequest,
  PlaceCategory,
} from '@/shared/api/generated/model'
import {
  App as AntdApp,
  Button,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
} from 'antd'
import { useState } from 'react'
import { CreatePlaceErrorAlert } from './create-place-error-alert'

type CreatePlaceFormValues = {
  category: PlaceCategory
  popularityWeight?: number | null
  summary: string
  tags: string[]
  title: string
}

type CreatePlaceFormProps = {
  onCancel: () => void
  onCreated: () => void
}

const categoryOptions = getPlaceCategoryOptions()

const normalizeTags = (tags: string[] | undefined) =>
  tags?.map((tag) => tag.trim()).filter(Boolean) ?? []

const toCreatePlaceRequest = (
  values: CreatePlaceFormValues,
): CreatePlaceRequest => ({
  category: values.category,
  popularityWeight: values.popularityWeight ?? undefined,
  summary: values.summary.trim(),
  tags: normalizeTags(values.tags),
  title: values.title.trim(),
})

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

  const handleFinish = (values: CreatePlaceFormValues) => {
    setErrorMessages([])
    createPlaceMutation.mutate({
      data: toCreatePlaceRequest(values),
    })
  }

  return (
    <Form<CreatePlaceFormValues>
      layout="vertical"
      name="create-place"
      onFinish={handleFinish}
      requiredMark={false}
    >
      {Boolean(errorMessages.length) && (
        <Form.Item>
          <CreatePlaceErrorAlert messages={errorMessages} />
        </Form.Item>
      )}

      <Form.Item
        label="Название"
        name="title"
        rules={[{ required: true, message: 'Введите название' }]}
      >
        <Input autoComplete="off" />
      </Form.Item>

      <Form.Item
        label="Описание"
        name="summary"
        rules={[{ required: true, message: 'Введите описание' }]}
      >
        <Input.TextArea autoSize={{ maxRows: 6, minRows: 3 }} />
      </Form.Item>

      <Form.Item
        label="Категория"
        name="category"
        rules={[{ required: true, message: 'Выберите категорию' }]}
      >
        <Select aria-label="Категория" options={categoryOptions} />
      </Form.Item>

      <Form.Item
        label="Теги"
        name="tags"
        rules={[{ required: true, message: 'Добавьте хотя бы один тег' }]}
      >
        <Select
          aria-label="Теги"
          mode="tags"
          placeholder="Добавьте теги"
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Form.Item label="Вес популярности" name="popularityWeight">
        <InputNumber min={0} precision={0} />
      </Form.Item>

      <Flex gap={8} justify="end" wrap>
        <Button onClick={onCancel}>Отмена</Button>
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
