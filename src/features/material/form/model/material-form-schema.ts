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

/** Zod-схема значений создания материала с обязательной исходной ссылкой. */
export const createMaterialFormSchema = z.strictObject({
  ...materialFormShape,
  url: requiredMaterialUrlSchema,
})

/** Zod-схема редактирования материала, когда исходная ссылка доступна в read-модели. */
export const editMaterialWithUrlFormSchema = z.strictObject({
  ...materialFormShape,
  url: requiredMaterialUrlSchema,
})

/** Zod-схема редактирования материала из списка без исходной ссылки. */
export const editMaterialWithoutUrlFormSchema = z.strictObject({
  ...materialFormShape,
  url: materialWithoutUrlSchema,
})
