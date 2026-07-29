import { usePlaceCategoriesQuery } from '@/entities/category/model/category-hooks'
import { getPlaceCategoryOptions } from '@/entities/place/ui/place-meta'
import { RhfFormItem } from '@/shared/ui/form/rhf-form-item'
import { Alert, Input, Select } from 'antd'
import type { Control } from 'react-hook-form'
import type { PlaceFormValues } from '../model/place-form'

/**
 * Props общего набора полей формы места.
 */
export type PlaceFormFieldsProps = {
  control: Control<PlaceFormValues>
  disabled?: boolean
  showSlug?: boolean
}

/**
 * Общие Ant Design поля для create/edit сценариев места.
 */
export function PlaceFormFields({
  control,
  disabled = false,
  showSlug = false,
}: PlaceFormFieldsProps) {
  const categoriesQuery = usePlaceCategoriesQuery()
  const categoryOptions = getPlaceCategoryOptions(
    categoriesQuery.data?.items ?? [],
  )
  const isCategorySelectDisabled =
    disabled || categoriesQuery.isPending || categoriesQuery.isError

  return (
    <>
      <RhfFormItem control={control} label="Название" name="title" required>
        {(field, controlProps) => (
          <Input
            aria-describedby={controlProps['aria-describedby']}
            aria-invalid={controlProps['aria-invalid']}
            autoComplete="off"
            disabled={disabled}
            id={controlProps.id}
            onBlur={field.onBlur}
            onChange={field.onChange}
            ref={(input) => field.ref(input?.input ?? null)}
            status={controlProps.status}
            value={field.value}
          />
        )}
      </RhfFormItem>

      {showSlug && (
        <RhfFormItem
          control={control}
          extra="Часть публичного адреса места. При создании может быть заполнена автоматически."
          label="Ярлык"
          name="slug"
        >
          {(field, controlProps) => (
            <Input
              aria-describedby={controlProps['aria-describedby']}
              aria-invalid={controlProps['aria-invalid']}
              aria-label="Ярлык"
              disabled={disabled}
              id={controlProps.id}
              onBlur={field.onBlur}
              onChange={field.onChange}
              placeholder="Например: quiet-spa"
              ref={(input) => field.ref(input?.input ?? null)}
              status={controlProps.status}
              value={field.value}
            />
          )}
        </RhfFormItem>
      )}

      <RhfFormItem control={control} label="Описание" name="summary">
        {(field, controlProps) => (
          <Input.TextArea
            aria-describedby={controlProps['aria-describedby']}
            aria-invalid={controlProps['aria-invalid']}
            autoSize={{ maxRows: 6, minRows: 3 }}
            disabled={disabled}
            id={controlProps.id}
            onBlur={field.onBlur}
            onChange={field.onChange}
            status={controlProps.status}
            value={field.value}
          />
        )}
      </RhfFormItem>

      <RhfFormItem
        control={control}
        label="Категория"
        name="categoryId"
        required
      >
        {(field, controlProps) => (
          <Select
            aria-describedby={controlProps['aria-describedby']}
            aria-invalid={controlProps['aria-invalid']}
            aria-label="Категория"
            disabled={isCategorySelectDisabled}
            id={controlProps.id}
            loading={categoriesQuery.isFetching}
            onBlur={field.onBlur}
            onChange={(value) => field.onChange(value ?? null)}
            options={categoryOptions}
            status={controlProps.status}
            value={field.value}
          />
        )}
      </RhfFormItem>

      {categoriesQuery.isError && (
        <Alert
          showIcon
          message={
            categoriesQuery.error?.message || 'Не удалось загрузить категории'
          }
          type="error"
        />
      )}

      <RhfFormItem control={control} label="Теги" name="tags">
        {(field, controlProps) => (
          <Select
            aria-describedby={controlProps['aria-describedby']}
            aria-invalid={controlProps['aria-invalid']}
            aria-label="Теги"
            disabled={disabled}
            id={controlProps.id}
            mode="tags"
            onBlur={field.onBlur}
            onChange={field.onChange}
            placeholder="Добавьте теги"
            status={controlProps.status}
            tokenSeparators={[',']}
            value={field.value ?? []}
          />
        )}
      </RhfFormItem>
    </>
  )
}
