import { zodResolver } from '@hookform/resolvers/zod'
import {
  useForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form'
import type { z } from 'zod'

type ZodFormInput<TSchema extends z.ZodType> =
  z.input<TSchema> extends FieldValues ? z.input<TSchema> : never

type ZodFormSchema<TSchema extends z.ZodType> = z.ZodType<
  z.output<TSchema>,
  ZodFormInput<TSchema>
>

type UseZodFormOptions<TSchema extends z.ZodType> = Omit<
  UseFormProps<ZodFormInput<TSchema>, unknown, z.output<TSchema>>,
  'resolver'
>

/**
 * Создаёт React Hook Form с типизированным Zod resolver.
 *
 * @remarks Параметр `options` необязателен. Hook не задаёт validation mode,
 * default values, reset, server errors или submit policy: их явно определяет
 * владелец конкретной формы.
 */
export function useZodForm<TSchema extends z.ZodType>(
  schema: TSchema & ZodFormSchema<TSchema>,
  options?: UseZodFormOptions<TSchema>,
): UseFormReturn<ZodFormInput<TSchema>, unknown, z.output<TSchema>> {
  return useForm<ZodFormInput<TSchema>, unknown, z.output<TSchema>>({
    ...options,
    resolver: zodResolver<ZodFormInput<TSchema>, unknown, z.output<TSchema>>(
      schema,
    ),
  })
}
