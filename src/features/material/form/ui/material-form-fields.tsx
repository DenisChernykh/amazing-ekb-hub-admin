import {
  getMaterialPlatformOptions,
  getMaterialTypeOptions,
} from '@/entities/material/ui/material-meta'
import { RhfFormItem } from '@/shared/ui/form/rhf-form-item'
import { DatePicker, Input, InputNumber, Select } from 'antd'
import { useWatch, type Control } from 'react-hook-form'
import {
  isMaterialDurationEnabled,
  type MaterialFormValues,
} from '../model/material-form'

/**
 * Props набора полей формы материала.
 */
export type MaterialFormFieldsProps = {
  control: Control<MaterialFormValues>
  disabled?: boolean
  showUrlField?: boolean
}

/**
 * Общие Ant Design поля создания и редактирования материала.
 */
export function MaterialFormFields({
  control,
  disabled,
  showUrlField = true,
}: MaterialFormFieldsProps) {
  const materialType = useWatch({
    control,
    name: 'type',
  })

  return (
    <>
      <RhfFormItem control={control} label="Платформа" name="platform" required>
        {(field, controlProps) => (
          <Select
            aria-describedby={controlProps['aria-describedby']}
            aria-invalid={controlProps['aria-invalid']}
            aria-label="Платформа"
            disabled={disabled}
            id={controlProps.id}
            onBlur={field.onBlur}
            onChange={field.onChange}
            options={getMaterialPlatformOptions()}
            ref={field.ref}
            status={controlProps.status}
            value={field.value ?? undefined}
          />
        )}
      </RhfFormItem>

      <RhfFormItem control={control} label="Тип" name="type" required>
        {(field, controlProps) => (
          <Select
            aria-describedby={controlProps['aria-describedby']}
            aria-invalid={controlProps['aria-invalid']}
            aria-label="Тип"
            disabled={disabled}
            id={controlProps.id}
            onBlur={field.onBlur}
            onChange={field.onChange}
            options={getMaterialTypeOptions()}
            ref={field.ref}
            status={controlProps.status}
            value={field.value ?? undefined}
          />
        )}
      </RhfFormItem>

      <RhfFormItem control={control} label="Заголовок" name="title" required>
        {(field, controlProps) => (
          <Input
            aria-describedby={controlProps['aria-describedby']}
            aria-invalid={controlProps['aria-invalid']}
            aria-label="Заголовок"
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

      <RhfFormItem
        control={control}
        label="Дата публикации"
        name="publishedAt"
        required
      >
        {(field, controlProps) => (
          <DatePicker
            aria-describedby={controlProps['aria-describedby']}
            aria-invalid={controlProps['aria-invalid']}
            aria-label="Дата публикации"
            disabled={disabled}
            format="DD.MM.YYYY"
            id={controlProps.id}
            onBlur={field.onBlur}
            onChange={(value) => field.onChange(value)}
            ref={field.ref}
            status={controlProps.status}
            style={{ width: '100%' }}
            value={field.value}
          />
        )}
      </RhfFormItem>

      {isMaterialDurationEnabled(materialType) && (
        <RhfFormItem
          control={control}
          label="Длительность, сек"
          name="durationSec"
        >
          {(field, controlProps) => (
            <InputNumber
              aria-describedby={controlProps['aria-describedby']}
              aria-invalid={controlProps['aria-invalid']}
              aria-label="Длительность, сек"
              disabled={disabled}
              id={controlProps.id}
              min={0}
              onBlur={field.onBlur}
              onChange={(value) => field.onChange(value)}
              precision={0}
              ref={field.ref}
              status={controlProps.status}
              style={{ width: '100%' }}
              value={field.value}
            />
          )}
        </RhfFormItem>
      )}

      {showUrlField && (
        <RhfFormItem control={control} label="Ссылка" name="url" required>
          {(field, controlProps) => (
            <Input
              aria-describedby={controlProps['aria-describedby']}
              aria-invalid={controlProps['aria-invalid']}
              aria-label="Ссылка"
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
      )}
    </>
  )
}
