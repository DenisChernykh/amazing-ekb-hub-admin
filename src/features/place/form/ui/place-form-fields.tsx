import { getPlaceCategoryOptions } from '@/entities/place/ui/place-meta'
import { Form, Input, InputNumber, Select } from 'antd'
import type { PlaceFormValues } from '../model/place-form'

/**
 * Props общего набора полей формы места.
 */
export type PlaceFormFieldsProps = {
  disabled?: boolean
  popularityWeightRequired?: boolean
}

const categoryOptions = getPlaceCategoryOptions()

/**
 * Общие Ant Design поля для create/edit сценариев места.
 */
export function PlaceFormFields({
  disabled = false,
  popularityWeightRequired = false,
}: PlaceFormFieldsProps) {
  return (
    <>
      <Form.Item<PlaceFormValues>
        label="Название"
        name="title"
        rules={[{ required: true, message: 'Введите название' }]}
      >
        <Input autoComplete="off" disabled={disabled} />
      </Form.Item>

      <Form.Item<PlaceFormValues>
        label="Описание"
        name="summary"
        rules={[{ required: true, message: 'Введите описание' }]}
      >
        <Input.TextArea
          autoSize={{ maxRows: 6, minRows: 3 }}
          disabled={disabled}
        />
      </Form.Item>

      <Form.Item<PlaceFormValues>
        label="Категория"
        name="category"
        rules={[{ required: true, message: 'Выберите категорию' }]}
      >
        <Select
          aria-label="Категория"
          disabled={disabled}
          options={categoryOptions}
        />
      </Form.Item>

      <Form.Item<PlaceFormValues>
        label="Теги"
        name="tags"
        rules={[{ required: true, message: 'Добавьте хотя бы один тег' }]}
      >
        <Select
          aria-label="Теги"
          disabled={disabled}
          mode="tags"
          placeholder="Добавьте теги"
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Form.Item<PlaceFormValues>
        label="Вес популярности"
        name="popularityWeight"
        rules={
          popularityWeightRequired
            ? [{ required: true, message: 'Введите вес популярности' }]
            : undefined
        }
      >
        <InputNumber disabled={disabled} min={0} precision={0} />
      </Form.Item>
    </>
  )
}
