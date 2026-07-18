import { usePlaceCategoriesQuery } from '@/entities/category/model/category-hooks'
import { getPlaceCategoryOptions } from '@/entities/place/ui/place-meta'
import { Alert, Form, Input, Select } from 'antd'
import {
  getPlaceSlugValidationError,
  type PlaceFormValues,
} from '../model/place-form'

/**
 * Props общего набора полей формы места.
 */
export type PlaceFormFieldsProps = {
  disabled?: boolean
  showSlug?: boolean
  slugRequired?: boolean
}

/**
 * Общие Ant Design поля для create/edit сценариев места.
 */
export function PlaceFormFields({
  disabled = false,
  showSlug = false,
  slugRequired = false,
}: PlaceFormFieldsProps) {
  const categoriesQuery = usePlaceCategoriesQuery()
  const categoryOptions = getPlaceCategoryOptions(
    categoriesQuery.data?.items ?? [],
  )
  const isCategorySelectDisabled =
    disabled || categoriesQuery.isPending || categoriesQuery.isError

  return (
    <>
      <Form.Item<PlaceFormValues>
        label="Название"
        name="title"
        rules={[{ required: true, message: 'Введите название' }]}
      >
        <Input autoComplete="off" disabled={disabled} />
      </Form.Item>

      {showSlug && (
        <Form.Item<PlaceFormValues>
          extra="Часть публичного адреса места. При создании может быть заполнена автоматически."
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

                const validationError = getPlaceSlugValidationError(value)

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
            placeholder="Например: quiet-spa"
          />
        </Form.Item>
      )}

      <Form.Item<PlaceFormValues> label="Описание" name="summary">
        <Input.TextArea
          autoSize={{ maxRows: 6, minRows: 3 }}
          disabled={disabled}
        />
      </Form.Item>

      <Form.Item<PlaceFormValues>
        label="Категория"
        name="categoryId"
        rules={[{ required: true, message: 'Выберите категорию' }]}
      >
        <Select
          aria-label="Категория"
          disabled={isCategorySelectDisabled}
          loading={categoriesQuery.isFetching}
          options={categoryOptions}
        />
      </Form.Item>

      {categoriesQuery.isError && (
        <Alert
          showIcon
          message={
            categoriesQuery.error?.message || 'Не удалось загрузить категории'
          }
          type="error"
        />
      )}

      <Form.Item<PlaceFormValues> label="Теги" name="tags">
        <Select
          aria-label="Теги"
          disabled={disabled}
          mode="tags"
          placeholder="Добавьте теги"
          tokenSeparators={[',']}
        />
      </Form.Item>
    </>
  )
}
