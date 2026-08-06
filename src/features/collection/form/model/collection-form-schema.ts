import { z } from 'zod'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const descriptionSchema = z
  .string()
  .trim()
  .max(10_000, 'Описание не должно быть длиннее 10000 символов')
const titleSchema = z.string().trim().min(1, 'Введите название')

/** Форма создания коллекции с optional slug и backend-compatible limits. */
export const createCollectionFormSchema = z.strictObject({
  description: descriptionSchema,
  slug: z
    .string()
    .trim()
    .refine(
      (value) => !value || slugPattern.test(value),
      'Используйте латинские буквы, цифры и дефисы',
    ),
  title: titleSchema,
})

/** Форма редактирования коллекции с обязательным существующим slug. */
export const editCollectionFormSchema = z.strictObject({
  description: descriptionSchema,
  slug: z
    .string()
    .trim()
    .min(1, 'Введите ярлык')
    .regex(slugPattern, 'Используйте латинские буквы, цифры и дефисы'),
  title: titleSchema,
})

/** Значения RHF-формы коллекции. */
export type CollectionFormValues = z.input<typeof createCollectionFormSchema>

/** Нормализует optional поля формы создания перед отправкой в API. */
export function toCreateCollectionRequest(values: CollectionFormValues) {
  const description = values.description.trim()
  const slug = values.slug.trim()
  return {
    ...(description ? { description } : { description: null }),
    ...(slug ? { slug } : {}),
    title: values.title,
  }
}

/** Сохраняет validated slug и nullable description при обновлении коллекции. */
export function toUpdateCollectionRequest(values: CollectionFormValues) {
  const description = values.description.trim()
  return {
    ...(description ? { description } : { description: null }),
    slug: values.slug.trim(),
    title: values.title,
  }
}
