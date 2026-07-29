import { zodResolver } from '@hookform/resolvers/zod'
import {
  useForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form'
import { z } from 'zod'

type ZodFormSchema = z.ZodType<FieldValues, FieldValues>

type UseZodFormOptions<TSchema extends ZodFormSchema> = Omit<
  UseFormProps<z.input<TSchema>, unknown, z.output<TSchema>>,
  'resolver'
>

/**
 * Создаёт React Hook Form с типизированным Zod resolver.
 *
 * @remarks Hook не задаёт validation mode, default values или submit policy:
 * их явно определяет владелец конкретной формы.
 */
export function useZodForm<TSchema extends ZodFormSchema>(
  schema: TSchema,
  options: UseZodFormOptions<TSchema>,
): UseFormReturn<z.input<TSchema>, unknown, z.output<TSchema>> {
  return useForm<z.input<TSchema>, unknown, z.output<TSchema>>({
    ...options,
    resolver: zodResolver(schema),
  })
}
