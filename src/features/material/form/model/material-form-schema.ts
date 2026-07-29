import { isSafeMaterialUrl } from '@/entities/material/model/material-url'
import { CreatePlaceMaterialBody } from '@/shared/api/generated-zod/admin/admin.zod'
import dayjs, { type Dayjs } from 'dayjs'
import { z } from 'zod'

const requiredPlatformSchema = z
  .union([CreatePlaceMaterialBody.shape.platform, z.null()])
  .refine((value) => value !== null, 'Выберите платформу')

const requiredMaterialTypeSchema = z
  .union([CreatePlaceMaterialBody.shape.type, z.null()])
  .refine((value) => value !== null, 'Выберите тип материала')

const publishedAtSchema = z
  .union([
    z.custom<Dayjs>(
      (value) => dayjs.isDayjs(value) && value.isValid(),
      'Выберите дату публикации',
    ),
    z.null(),
  ])
  .refine((value) => value !== null, 'Выберите дату публикации')

const requiredMaterialUrlSchema = z
  .string()
  .trim()
  .min(1, 'Введите ссылку')
  .refine(
    (url) =>
      url.length === 0 ||
      (CreatePlaceMaterialBody.shape.url.safeParse(url).success &&
        isSafeMaterialUrl(url)),
    'Введите ссылку с протоколом http или https',
  )

const materialWithoutUrlSchema = z.string()

const materialFormShape = {
  durationSec: CreatePlaceMaterialBody.shape.durationSec.unwrap(),
  platform: requiredPlatformSchema,
  publishedAt: publishedAtSchema,
  title: CreatePlaceMaterialBody.shape.title.trim().min(1, 'Введите заголовок'),
  type: requiredMaterialTypeSchema,
}

/**
 * Общая входная Zod-схема значений формы материала до сценарной валидации URL.
 *
 * @remarks Сохраняет UI-контракты `Dayjs`, nullable select-значений и nullable
 * длительности для RHF create/edit сценариев.
 */
export const materialFormInputSchema = z.strictObject({
  ...materialFormShape,
  url: z.string(),
})

/**
 * Входные значения общей формы создания и редактирования материала.
 *
 * @remarks Выведен из общей Zod-схемы, поэтому сохраняет native UI-значения
 * до нормализации в API payload.
 */
export type MaterialFormValues = z.input<typeof materialFormInputSchema>

/** Zod-схема значений создания материала с обязательной исходной ссылкой. */
export const createMaterialFormSchema = materialFormInputSchema.extend({
  url: requiredMaterialUrlSchema,
})

/** Zod-схема редактирования материала, когда исходная ссылка доступна в read-модели. */
export const editMaterialWithUrlFormSchema = materialFormInputSchema.extend({
  url: requiredMaterialUrlSchema,
})

/** Zod-схема редактирования материала из списка без исходной ссылки. */
export const editMaterialWithoutUrlFormSchema = materialFormInputSchema.extend({
  url: materialWithoutUrlSchema,
})
