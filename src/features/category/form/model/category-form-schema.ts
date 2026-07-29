import {
  CreatePlaceCategoryBody,
  UpdatePlaceCategoryBody,
} from '@/shared/api/generated-zod/admin/admin.zod'
import { z } from 'zod'

const categorySlugGuidance =
  'Используйте маленькие латинские буквы, цифры и дефисы, например family-cafe'

const isGeneratedCreateSlug = (value: string) =>
  !value || CreatePlaceCategoryBody.shape.slug.unwrap().safeParse(value).success

const optionalCategorySlugSchema = z
  .string()
  .trim()
  .refine(isGeneratedCreateSlug, categorySlugGuidance)

/** Zod-схема create-формы категории. */
export const createCategoryFormSchema = z.strictObject({
  slug: optionalCategorySlugSchema,
  title: CreatePlaceCategoryBody.shape.title.trim().min(1, 'Введите название'),
})

/** Zod-схема edit-формы категории. */
export const editCategoryFormSchema = z.strictObject({
  slug: z
    .string()
    .trim()
    .min(1, 'Введите ярлык')
    .refine(
      (value) =>
        UpdatePlaceCategoryBody.shape.slug.unwrap().safeParse(value).success,
      categorySlugGuidance,
    ),
  title: createCategoryFormSchema.shape.title,
})

/** Значения общей RHF формы категории. */
export type CategoryFormValues = z.input<typeof editCategoryFormSchema>
