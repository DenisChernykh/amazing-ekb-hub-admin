import { z } from 'zod'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Общая форма create/edit коллекции с backend-compatible limits. */
export const collectionFormSchema = z.strictObject({
  description: z
    .string()
    .trim()
    .max(10_000, 'Описание не должно быть длиннее 10000 символов'),
  slug: z
    .string()
    .trim()
    .refine(
      (value) => !value || slugPattern.test(value),
      'Используйте латинские буквы, цифры и дефисы',
    ),
  title: z.string().trim().min(1, 'Введите название'),
})

/** Значения RHF-формы коллекции. */
export type CollectionFormValues = z.input<typeof collectionFormSchema>

/** Нормализует optional поля формы перед отправкой в API. */
export function toCollectionRequest(values: CollectionFormValues) {
  const description = values.description.trim()
  const slug = values.slug.trim()
  return {
    ...(description ? { description } : { description: null }),
    ...(slug ? { slug } : {}),
    title: values.title,
  }
}
