import { normalizeMaterialUrl } from '@/entities/material/model/material-url'
import type {
  CreateMaterialDto,
  MaterialResponseDto,
  MaterialResponseDtoPlatform,
  MaterialResponseDtoType,
  UpdateMaterialDto,
} from '@/shared/api'
import dayjs, { type Dayjs } from 'dayjs'
import type { MaterialFormValues } from './material-form-schema'

export type { MaterialFormValues } from './material-form-schema'

type NormalizedMaterialFormValues = {
  durationSec: number | null
  platform: MaterialResponseDtoPlatform | null
  publishedAt: string | null
  title: string
  type: MaterialResponseDtoType | null
  url: string
}

/**
 * Поле материала, измененное в edit drawer после нормализации.
 */
export type MaterialFormChangedField = {
  key: keyof NormalizedMaterialFormValues
  label: string
}

/**
 * Материал для edit-flow: read-модели списков могут не содержать исходный URL.
 */
export type EditableMaterial = Omit<MaterialResponseDto, 'url'> & {
  url?: string
}

const materialFormFieldLabels = {
  platform: 'Платформа',
  type: 'Тип',
  title: 'Заголовок',
  publishedAt: 'Публикация',
  durationSec: 'Длительность',
  url: 'Ссылка',
} satisfies Record<keyof NormalizedMaterialFormValues, string>

const materialFormFieldKeys: Array<keyof NormalizedMaterialFormValues> = [
  'platform',
  'type',
  'title',
  'publishedAt',
  'durationSec',
  'url',
]

/**
 * Проверяет, применимо ли поле длительности к типу материала.
 *
 * @returns `true` только для видеоформатов, где backend ожидает duration.
 */
export function isMaterialDurationEnabled(
  type: MaterialResponseDtoType | null | undefined,
) {
  return type === 'reel' || type === 'video'
}

const serializePublishedAt = (publishedAt: Dayjs | null | undefined) => {
  if (!publishedAt) {
    return null
  }

  return publishedAt.format('YYYY-MM-DD')
}

const parsePublishedAtWallClock = (publishedAt: string) => {
  return dayjs(publishedAt.slice(0, 19))
}

const normalizeMaterialFormValues = (
  values: MaterialFormValues,
): NormalizedMaterialFormValues => {
  const type = values.type ?? null

  return {
    durationSec: isMaterialDurationEnabled(type)
      ? (values.durationSec ?? null)
      : null,
    platform: values.platform ?? null,
    publishedAt: serializePublishedAt(values.publishedAt),
    title: (values.title ?? '').trim(),
    type,
    url: (values.url ?? '').trim(),
  }
}

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
  material: EditableMaterial,
): MaterialFormValues {
  return {
    durationSec: material.durationSec,
    platform: material.platform,
    publishedAt: parsePublishedAtWallClock(material.publishedAt),
    title: material.title ?? '',
    type: material.type,
    url: material.url ?? '',
  }
}

/**
 * Преобразует значения формы в payload создания материала.
 *
 * @remarks `publishedAt` сериализуется как календарная дата `YYYY-MM-DD`,
 * без времени и UTC-нормализации.
 */
export function toCreateMaterialRequest(
  values: MaterialFormValues,
): CreateMaterialDto {
  const normalizedValues = normalizeMaterialFormValues(values)
  const type = getRequiredValue(normalizedValues.type, 'type')
  const request: CreateMaterialDto = {
    platform: getRequiredValue(normalizedValues.platform, 'platform'),
    publishedAt: getRequiredValue(normalizedValues.publishedAt, 'publishedAt'),
    title: normalizedValues.title,
    type,
    url: normalizeMaterialUrl(values.url),
  }

  if (isMaterialDurationEnabled(type)) {
    request.durationSec = normalizedValues.durationSec
  }

  return request
}

/**
 * Преобразует значения формы редактирования в частичный `PATCH` payload.
 *
 * @remarks В payload попадают только поля, изменившиеся после нормализации.
 */
export function toUpdateMaterialRequest(
  values: MaterialFormValues,
  initialValues: MaterialFormValues,
): UpdateMaterialDto {
  const normalizedValues = normalizeMaterialFormValues(values)
  const normalizedInitialValues = normalizeMaterialFormValues(initialValues)
  const request: UpdateMaterialDto = {}
  const isDurationEnabled = isMaterialDurationEnabled(normalizedValues.type)
  const wasDurationEnabled = isMaterialDurationEnabled(
    normalizedInitialValues.type,
  )

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

  if (
    isDurationEnabled &&
    normalizedValues.durationSec !== normalizedInitialValues.durationSec
  ) {
    request.durationSec = normalizedValues.durationSec
  }

  if (
    wasDurationEnabled &&
    !isDurationEnabled &&
    normalizedInitialValues.durationSec !== null
  ) {
    request.durationSec = null
  }

  if (normalizedValues.url !== normalizedInitialValues.url) {
    request.url = normalizeMaterialUrl(values.url)
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

  return materialFormFieldKeys.flatMap((field) => {
    const label = materialFormFieldLabels[field]

    if (
      field === 'durationSec' &&
      !isMaterialDurationEnabled(normalizedValues.type)
    ) {
      return []
    }

    if (normalizedValues[field] === normalizedInitialValues[field]) {
      return []
    }

    return [{ key: field, label }]
  })
}
