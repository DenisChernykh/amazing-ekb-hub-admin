import { AdminPlacesCreateBody } from '@/shared/api'
import { z } from 'zod'

const PLACE_SLUG_GUIDANCE =
  'Используйте маленькие латинские буквы, цифры и дефисы, например quiet-spa'

const isGeneratedSlug = (value: string) =>
  AdminPlacesCreateBody.shape.slug.safeParse(value).success

const placeSlugSchema = z
  .string()
  .trim()
  .refine((value) => !value || isGeneratedSlug(value), {
    message: PLACE_SLUG_GUIDANCE,
  })

const placeTitleSchema = z
  .string()
  .trim()
  .min(1, 'Введите название')
  .pipe(AdminPlacesCreateBody.shape.title)

const placeCategorySchema = z
  .union([AdminPlacesCreateBody.shape.categoryId, z.null()])
  .refine((value) => value !== null, { message: 'Выберите категорию' })

const placeSummarySchema = AdminPlacesCreateBody.shape.summary.unwrap().trim()
const placeTagsSchema = AdminPlacesCreateBody.shape.tags.unwrap().default([])

/** Схема значений формы создания места с необязательным ручным slug. */
export const createPlaceFormSchema = z.object({
  categoryId: placeCategorySchema,
  slug: placeSlugSchema,
  summary: placeSummarySchema,
  tags: placeTagsSchema,
  title: placeTitleSchema,
})

/** Схема значений формы редактирования места с обязательным slug. */
export const editPlaceFormSchema = z.object({
  categoryId: placeCategorySchema,
  slug: placeSlugSchema.min(1, 'Введите ярлык'),
  summary: placeSummarySchema,
  tags: placeTagsSchema,
  title: placeTitleSchema,
})
