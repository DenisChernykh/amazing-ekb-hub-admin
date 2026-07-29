import { getContentSourcePlatformOptions } from '@/entities/content-source/ui/content-source-meta'
import type { ContentSourceFormValues } from '@/features/content-source/form/model/content-source-form'
import { RhfFormItem } from '@/shared/ui/form/rhf-form-item'
import { Input, Select } from 'antd'
import type { Control } from 'react-hook-form'

/**
 * Props набора полей формы content source.
 */
export type ContentSourceFormFieldsProps = {
  /** RHF control владельца create/edit формы source. */
  control: Control<ContentSourceFormValues>
  disabled?: boolean
  platformDisabled?: boolean
}

/**
 * Общие RHF-поля создания и редактирования content source.
 */
export function ContentSourceFormFields({
  control,
  disabled,
  platformDisabled,
}: ContentSourceFormFieldsProps) {
  return (
    <>
      <RhfFormItem control={control} label="Платформа" name="platform">
        {(field, controlProps) => (
          <Select
            {...controlProps}
            aria-label="Платформа"
            disabled={disabled || platformDisabled}
            onBlur={field.onBlur}
            onChange={field.onChange}
            options={getContentSourcePlatformOptions()}
            value={field.value}
          />
        )}
      </RhfFormItem>

      <RhfFormItem control={control} label="Название" name="displayName" required>
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

      <RhfFormItem control={control} label="Ссылка" name="url" required>
        {(field, controlProps) => (
          <Input
            {...controlProps}
            aria-label="Ссылка"
            disabled={disabled}
            onBlur={field.onBlur}
            onChange={field.onChange}
            ref={field.ref}
            value={field.value}
          />
        )}
      </RhfFormItem>

      <RhfFormItem control={control} label="External ID" name="externalId">
        {(field, controlProps) => (
          <Input
            {...controlProps}
            aria-label="External ID"
            disabled={disabled}
            onBlur={field.onBlur}
            onChange={field.onChange}
            ref={field.ref}
            value={field.value}
          />
        )}
      </RhfFormItem>

      <RhfFormItem control={control} label="Handle" name="handle">
        {(field, controlProps) => (
          <Input
            {...controlProps}
            aria-label="Handle"
            disabled={disabled}
            onBlur={field.onBlur}
            onChange={field.onChange}
            ref={field.ref}
            value={field.value}
          />
        )}
      </RhfFormItem>

      <RhfFormItem control={control} label="Channel ID" name="channelId">
        {(field, controlProps) => (
          <Input
            {...controlProps}
            aria-label="Channel ID"
            disabled={disabled}
            onBlur={field.onBlur}
            onChange={field.onChange}
            ref={field.ref}
            value={field.value}
          />
        )}
      </RhfFormItem>
    </>
  )
}
