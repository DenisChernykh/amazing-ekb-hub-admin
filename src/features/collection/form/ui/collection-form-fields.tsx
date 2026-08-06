import type { CollectionFormValues } from '@/features/collection/form/model/collection-form-schema'
import { RhfFormItem } from '@/shared/ui/form/rhf-form-item'
import { Input } from 'antd'
import type { Control } from 'react-hook-form'

/** Props общего набора полей коллекции. */
export type CollectionFormFieldsProps = {
  control: Control<CollectionFormValues>
  disabled?: boolean
}

/** Рендерит title, slug и optional description поля коллекции. */
export function CollectionFormFields({
  control,
  disabled,
}: CollectionFormFieldsProps) {
  return (
    <>
      <RhfFormItem control={control} label="Название" name="title" required>
        {(field, controlProps) => (
          <Input
            {...controlProps}
            disabled={disabled}
            onBlur={field.onBlur}
            onChange={field.onChange}
            ref={field.ref}
            value={field.value}
          />
        )}
      </RhfFormItem>
      <RhfFormItem
        control={control}
        extra="Латинские буквы, цифры и дефисы."
        label="Ярлык"
        name="slug"
      >
        {(field, controlProps) => (
          <Input
            {...controlProps}
            disabled={disabled}
            onBlur={field.onBlur}
            onChange={field.onChange}
            ref={field.ref}
            value={field.value}
          />
        )}
      </RhfFormItem>
      <RhfFormItem control={control} label="Описание" name="description">
        {(field, controlProps) => (
          <Input.TextArea
            {...controlProps}
            autoSize={{ minRows: 4, maxRows: 12 }}
            disabled={disabled}
            maxLength={10_000}
            onBlur={field.onBlur}
            onChange={field.onChange}
            ref={field.ref}
            showCount
            value={field.value}
          />
        )}
      </RhfFormItem>
    </>
  )
}
