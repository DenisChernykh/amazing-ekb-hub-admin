import { usePlaceCategoriesQuery } from '@/entities/category/model/category-hooks'
import { getPlaceCategoryOptions } from '@/entities/place/ui/place-meta'
import { Alert, Form, Input, InputNumber, Select } from 'antd'
import type { PlaceFormValues } from '../model/place-form'

/**
 * Props общего набора полей формы места.
 */
export type PlaceFormFieldsProps = {
  disabled?: boolean
  popularityWeightRequired?: boolean
}

/**
 * Общие Ant Design поля для create/edit сценариев места.
 */
export function PlaceFormFields({
  disabled = false,
  popularityWeightRequired = false,
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
