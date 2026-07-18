import {
  getCategorySlugValidationError,
  type CategoryFormValues,
} from '@/features/category/form/model/category-form'
import { Form, Input } from 'antd'

/**
 * Props набора полей формы категории.
 */
export type CategoryFormFieldsProps = {
  /** Блокирует поля во время сохранения категории. */
  disabled?: boolean
  /** Показывает поле ярлыка, которое скрыто в сценарии создания категории. */
  showSlug?: boolean
  /** Требует заполнить ярлык в сценарии редактирования категории. */
  slugRequired?: boolean
}

/**
 * Общие Ant Design поля создания и редактирования категории места.
 *
 * @remarks Поле ярлыка показывается явно через `showSlug`, чтобы сценарий создания оставался менеджерским и полагался на backend-автогенерацию адреса.
 */
export function CategoryFormFields({
  disabled,
  showSlug,
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

      {showSlug && (
        <Form.Item<CategoryFormValues>
          extra="Часть адреса в ссылке. Обычно заполняется автоматически."
          label="Ярлык"
          name="slug"
          rules={[
            ...(slugRequired
              ? [
                  {
                    message: 'Введите ярлык',
                    required: true,
                    whitespace: true,
                  },
                ]
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
            aria-label="Ярлык"
            disabled={disabled}
            placeholder="Например: family-cafe"
          />
        </Form.Item>
      )}
    </>
  )
}
