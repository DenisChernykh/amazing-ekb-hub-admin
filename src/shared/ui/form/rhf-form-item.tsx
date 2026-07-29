import { Form, type FormItemProps } from 'antd'
import { useId, type ReactNode } from 'react'
import {
  useController,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

/** Accessibility и validation props для конкретного AntD control. */
export type RhfControlStatusProps = {
  'aria-describedby'?: string
  'aria-invalid': boolean
  id: string
  status?: 'error'
}

/** Props presentation adapter между RHF field state и AntD `Form.Item`. */
export type RhfFormItemProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = Omit<
  FormItemProps,
  'children' | 'help' | 'htmlFor' | 'name' | 'rules' | 'validateStatus'
> & {
  children: (
    field: ControllerRenderProps<TFieldValues, TName>,
    controlProps: RhfControlStatusProps,
  ) => ReactNode
  control: Control<TFieldValues, unknown, TTransformedValues>
  controlId?: string
  name: TName
}

/**
 * Отображает RHF field error через AntD `Form.Item` и связывает его с control.
 */
export function RhfFormItem<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  children,
  control,
  controlId,
  name,
  ...formItemProps
}: RhfFormItemProps<TFieldValues, TName, TTransformedValues>) {
  const generatedId = useId()
  const { field, fieldState } = useController({ control, name })
  const inputId = controlId ?? generatedId
  const errorId = fieldState.error ? `${inputId}-error` : undefined

  return (
    <Form.Item
      {...formItemProps}
      help={
        fieldState.error ? (
          <span id={errorId}>{fieldState.error.message}</span>
        ) : undefined
      }
      htmlFor={inputId}
      layout="vertical"
      validateStatus={fieldState.error ? 'error' : undefined}
    >
      {children(field, {
        'aria-describedby': errorId,
        'aria-invalid': fieldState.invalid,
        id: inputId,
        status: fieldState.invalid ? 'error' : undefined,
      })}
    </Form.Item>
  )
}
