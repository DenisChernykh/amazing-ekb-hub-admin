import type {
  CreateMaterialRequest,
  Material,
  MaterialType,
  Platform,
  UpdateMaterialRequest,
} from '@/shared/api/generated/model'
import dayjs, { type Dayjs } from 'dayjs'

/**
 * Значения общей формы создания и редактирования материала.
 *
 * @remarks Поля допускают `undefined`, пока Ant Design Form еще не прошла
 * required-валидацию. Payload builders ожидают валидные значения формы.
 */
export type MaterialFormValues = {
  durationSec?: number | null
  platform?: Platform
  publishedAt?: Dayjs | null
  title?: string
  type?: MaterialType
  url?: string
}

type NormalizedMaterialFormValues = {
  durationSec: number | null
  platform: Platform | null
  publishedAt: string | null
  title: string
  type: MaterialType | null
  url: string
}

/**
 * Поле материала, измененное в edit drawer после нормализации.
 */
export type MaterialFormChangedField = {
  key: keyof NormalizedMaterialFormValues
  label: string
}

const materialFormFieldLabels = {
  platform: 'Платформа',
  type: 'Тип',
  title: 'Заголовок',
  publishedAt: 'Публикация',
  durationSec: 'Длительность',
  url: 'Ссылка',
} satisfies Record<keyof NormalizedMaterialFormValues, string>

const serializePublishedAt = (publishedAt: Dayjs | null | undefined) => {
  if (!publishedAt) {
    return null
  }

  return publishedAt.format('YYYY-MM-DDTHH:mm:ssZ')
}

const parsePublishedAtWallClock = (publishedAt: string) => {
  return dayjs(publishedAt.slice(0, 19))
}

const normalizeMaterialFormValues = (
  values: MaterialFormValues,
): NormalizedMaterialFormValues => ({
  durationSec: values.durationSec ?? null,
  platform: values.platform ?? null,
  publishedAt: serializePublishedAt(values.publishedAt),
  title: (values.title ?? '').trim(),
  type: values.type ?? null,
  url: (values.url ?? '').trim(),
})

const getRequiredValue = <T>(value: T | null, fieldName: string): T => {
  if (value === null) {
    throw new Error(`Material form field "${fieldName}" is required`)
  }

  return value
}

/**
 * Возвращает начальные значения формы из материала.
 */
export function getMaterialFormInitialValues(
  material: Material,
): MaterialFormValues {
  return {
    durationSec: material.durationSec,
    platform: material.platform,
    publishedAt: parsePublishedAtWallClock(material.publishedAt),
    title: material.title,
    type: material.type,
    url: material.url,
  }
}

/**
 * Преобразует значения формы в payload создания материала.
 *
 * @remarks `publishedAt` сериализуется с локальным смещением через `dayjs.format`,
 * без `toISOString()`, чтобы выбранный календарный день не сдвигался в UTC.
 */
export function toCreateMaterialRequest(
  values: MaterialFormValues,
): CreateMaterialRequest {
  const normalizedValues = normalizeMaterialFormValues(values)

  return {
    durationSec: normalizedValues.durationSec,
    platform: getRequiredValue(normalizedValues.platform, 'platform'),
    publishedAt: getRequiredValue(normalizedValues.publishedAt, 'publishedAt'),
    title: normalizedValues.title,
    type: getRequiredValue(normalizedValues.type, 'type'),
    url: normalizedValues.url,
  }
}

/**
 * Преобразует значения формы редактирования в частичный `PATCH` payload.
 *
 * @remarks В payload попадают только поля, изменившиеся после нормализации.
 */
export function toUpdateMaterialRequest(
  values: MaterialFormValues,
  initialValues: MaterialFormValues,
): UpdateMaterialRequest {
  const normalizedValues = normalizeMaterialFormValues(values)
  const normalizedInitialValues = normalizeMaterialFormValues(initialValues)
  const request: UpdateMaterialRequest = {}

  if (normalizedValues.platform !== normalizedInitialValues.platform) {
    request.platform = getRequiredValue(normalizedValues.platform, 'platform')
  }

  if (normalizedValues.type !== normalizedInitialValues.type) {
    request.type = getRequiredValue(normalizedValues.type, 'type')
  }

  if (normalizedValues.title !== normalizedInitialValues.title) {
    request.title = normalizedValues.title
  }

  if (normalizedValues.publishedAt !== normalizedInitialValues.publishedAt) {
    request.publishedAt = getRequiredValue(
      normalizedValues.publishedAt,
      'publishedAt',
    )
  }

  if (normalizedValues.durationSec !== normalizedInitialValues.durationSec) {
    request.durationSec = normalizedValues.durationSec
  }

  if (normalizedValues.url !== normalizedInitialValues.url) {
    request.url = normalizedValues.url
  }

  return request
}

/**
 * Проверяет, отличается ли форма материала от серверных значений после нормализации.
 */
export function hasMaterialFormChanges(
  values: MaterialFormValues,
  initialValues: MaterialFormValues,
) {
  return getMaterialFormChangedFields(values, initialValues).length > 0
}

/**
 * Возвращает список измененных полей формы материала для edit drawer.
 */
export function getMaterialFormChangedFields(
  values: MaterialFormValues,
  initialValues: MaterialFormValues,
): MaterialFormChangedField[] {
  const normalizedValues = normalizeMaterialFormValues(values)
  const normalizedInitialValues = normalizeMaterialFormValues(initialValues)

  return Object.entries(materialFormFieldLabels).flatMap(([key, label]) => {
    const field = key as keyof NormalizedMaterialFormValues

    if (normalizedValues[field] === normalizedInitialValues[field]) {
      return []
    }

    return [{ key: field, label }]
  })
}
