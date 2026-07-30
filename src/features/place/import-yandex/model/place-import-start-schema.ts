import { AdminPlaceImportsStartBody } from '@/shared/api'
import { isSafeHttpUrl } from '@/shared/lib/url/safe-url'
import { z } from 'zod'

/**
 * Zod-схема URL для запуска импорта одной карточки Яндекс Карт.
 */
export const placeImportStartSchema = z.strictObject({
  url: z
    .string()
    .trim()
    .min(1, 'Вставьте ссылку на карточку организации')
    .refine(
      (url) =>
        AdminPlaceImportsStartBody.shape.url.safeParse(url).success &&
        isSafeHttpUrl(url),
      'Введите ссылку с протоколом http или https',
    ),
})

/**
 * Значения RHF формы запуска импорта.
 */
export type PlaceImportStartValues = z.input<typeof placeImportStartSchema>
