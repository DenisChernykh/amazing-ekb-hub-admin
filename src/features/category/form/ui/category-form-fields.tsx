import type { CategoryFormValues } from '@/features/category/form/model/category-form-schema'
import { RhfFormItem } from '@/shared/ui/form/rhf-form-item'
import { Input } from 'antd'
import type { Control } from 'react-hook-form'

/**
 * Props набора полей формы категории.
 */
export type CategoryFormFieldsProps = {
  /** RHF control владельца create/edit формы категории. */
  control: Control<CategoryFormValues>
  /** Блокирует поля во время сохранения категории. */
  disabled?: boolean
  /** Показывает поле ярлыка, которое скрыто в сценарии создания категории. */
  showSlug?: boolean
}

/**
 * Общие RHF-поля создания и редактирования категории места.
 *
 * @remarks Поле ярлыка показывается явно через `showSlug`, чтобы сценарий создания оставался менеджерским и полагался на backend-автогенерацию адреса.
 */
export function CategoryFormFields({
  control,
  disabled,
  showSlug,
}: CategoryFormFieldsProps) {
  return (
    <>
      <RhfFormItem control={control} label="Название" name="title" required>
        {(field, controlProps) => (
          <Input
            {...controlProps}
            aria-label="Название"
            disabled={disabled}
            onBlur={field.onBlur}
            onChange={field.onChange}
            ref={field.ref}
            value={field.value}
          />
        )}
      </RhfFormItem>

      {showSlug && (
        <RhfFormItem
          control={control}
          extra="Часть адреса в ссылке. Обычно заполняется автоматически."
          label="Ярлык"
          name="slug"
        >
          {(field, controlProps) => (
            <Input
              {...controlProps}
              aria-label="Ярлык"
              disabled={disabled}
              onBlur={field.onBlur}
              onChange={field.onChange}
              placeholder="Например: family-cafe"
              ref={field.ref}
              value={field.value}
            />
          )}
        </RhfFormItem>
      )}
    </>
  )
}
