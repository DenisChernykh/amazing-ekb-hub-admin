import {
  getCategoryColorValidationError,
  getCategorySlugValidationError,
  type CategoryFormValues,
} from '@/features/category/form/model/category-form'
import { ColorPicker, Form, Input } from 'antd'
import type { Color } from 'antd/es/color-picker'

const getColorValueFromPicker = (color: Color) =>
  color.toHexString().toLowerCase()

/**
 * Props набора полей формы категории.
 */
export type CategoryFormFieldsProps = {
  disabled?: boolean
  slugRequired?: boolean
}

/**
 * Общие Ant Design поля создания и редактирования категории места.
 */
export function CategoryFormFields({
  disabled,
  slugRequired,
}: CategoryFormFieldsProps) {
  return (
    <>
      <Form.Item<CategoryFormValues>
        label="Название"
        name="title"
        rules={[
          { message: 'Введите название', required: true, whitespace: true },
        ]}
      >
        <Input aria-label="Название" disabled={disabled} />
      </Form.Item>

      <Form.Item<CategoryFormValues>
        label="Slug"
        name="slug"
        rules={[
          ...(slugRequired
            ? [{ message: 'Введите slug', required: true, whitespace: true }]
            : []),
          {
            validator: async (_rule, value: unknown) => {
              if (typeof value !== 'string') {
                return
              }

              const validationError = getCategorySlugValidationError(value)

              if (validationError) {
                throw new Error(validationError)
              }
            },
          },
        ]}
      >
        <Input
          aria-label="Slug"
          disabled={disabled}
          placeholder="backend сгенерирует автоматически"
        />
      </Form.Item>

      <Form.Item<CategoryFormValues>
        label="Цвет бейджа"
        name="badgeBackgroundColor"
        getValueFromEvent={getColorValueFromPicker}
        rules={[
          { message: 'Введите HEX-цвет', required: true, whitespace: true },
          {
            validator: async (_rule, value: unknown) => {
              if (typeof value !== 'string') {
                return
              }

              const validationError = getCategoryColorValidationError(value)

              if (validationError) {
                throw new Error(validationError)
              }
            },
          },
        ]}
      >
        <ColorPicker
          disabledAlpha
          disabledFormat
          disabled={disabled}
          format="hex"
          showText
        />
      </Form.Item>
    </>
  )
}
