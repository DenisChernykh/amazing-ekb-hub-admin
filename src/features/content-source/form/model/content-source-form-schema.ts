import { CreateContentSourceBody } from '@/shared/api/generated-zod/admin/admin.zod'
import { isSafeHttpUrl } from '@/shared/lib/url/safe-url'
import { z } from 'zod'

const requiredPlatformSchema = z
  .union([CreateContentSourceBody.shape.platform, z.null()])
  .refine((platform) => platform !== null, 'Выберите платформу')

const sourceUrlSchema = z
  .string()
  .trim()
  .min(1, 'Введите ссылку')
  .refine(
    (url) =>
      CreateContentSourceBody.shape.url.safeParse(url).success &&
      isSafeHttpUrl(url),
    'Введите ссылку с протоколом http или https',
  )

const contentSourceFormShape = {
  channelId: z.string().trim(),
  displayName: CreateContentSourceBody.shape.displayName
    .trim()
    .min(1, 'Введите название'),
  externalId: z.string().trim(),
  handle: z.string().trim(),
  platform: requiredPlatformSchema,
  url: sourceUrlSchema,
}

/** Zod-схема create-формы content source. */
export const createContentSourceFormSchema = z.strictObject(
  contentSourceFormShape,
)

/** Zod-схема edit-формы content source. */
export const editContentSourceFormSchema = z.strictObject(contentSourceFormShape)

/** Значения общей RHF формы content source. */
export type ContentSourceFormValues = z.input<
  typeof createContentSourceFormSchema
>
