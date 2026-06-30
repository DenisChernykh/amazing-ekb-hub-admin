import type {
  ContentSource,
  ContentSourcePlatform,
  CreateContentSourceRequest,
  UpdateContentSourceRequest,
} from '@/shared/api/generated/model'
import { normalizeHttpUrl } from '@/shared/lib/url/safe-url'

/**
 * Значения общей формы создания и редактирования content source.
 *
 * @remarks Поля допускают `undefined`, пока Ant Design Form еще не прошла required-валидацию.
 */
export type ContentSourceFormValues = {
  channelId?: string
  displayName?: string
  externalId?: string
  handle?: string
  platform?: ContentSourcePlatform
  url?: string
}

type NormalizedContentSourceFormValues = {
  channelId: string | null
  displayName: string
  externalId: string | null
  handle: string | null
  platform: ContentSourcePlatform | null
  url: string
}

/**
 * Поле content source, измененное в edit drawer после нормализации.
 */
export type ContentSourceFormChangedField = {
  key: keyof NormalizedContentSourceFormValues
  label: string
}

const contentSourceFormFieldLabels = {
  channelId: 'Channel ID',
  displayName: 'Название',
  externalId: 'External ID',
  handle: 'Handle',
  platform: 'Платформа',
  url: 'Ссылка',
} satisfies Record<keyof NormalizedContentSourceFormValues, string>

const contentSourceFormFieldKeys: Array<
  keyof NormalizedContentSourceFormValues
> = ['channelId', 'displayName', 'externalId', 'handle', 'platform', 'url']

const trimOptionalValue = (value: string | undefined) => {
  const trimmedValue = (value ?? '').trim()

  return trimmedValue ? trimmedValue : null
}

const normalizeContentSourceFormValues = (
  values: ContentSourceFormValues,
): NormalizedContentSourceFormValues => ({
  channelId: trimOptionalValue(values.channelId),
  displayName: (values.displayName ?? '').trim(),
  externalId: trimOptionalValue(values.externalId),
  handle: trimOptionalValue(values.handle),
  platform: values.platform ?? null,
  url: (values.url ?? '').trim(),
})

const getRequiredValue = <T>(value: T | null, fieldName: string): T => {
  if (value === null) {
    throw new Error(`Content source form field "${fieldName}" is required`)
  }

  return value
}

const assignOptionalCreateField = <
  TKey extends keyof Pick<
    CreateContentSourceRequest,
    'channelId' | 'externalId' | 'handle'
  >,
>(
  request: CreateContentSourceRequest,
  key: TKey,
  value: string | null,
) => {
  if (value !== null) {
    request[key] = value
  }
}

/**
 * Возвращает начальные значения формы из content source.
 */
export function getContentSourceFormInitialValues(
  contentSource: ContentSource,
): ContentSourceFormValues {
  return {
    channelId: contentSource.channelId ?? '',
    displayName: contentSource.displayName,
    externalId: contentSource.externalId ?? '',
    handle: contentSource.handle ?? '',
    platform: contentSource.platform,
    url: contentSource.url,
  }
}

/**
 * Преобразует значения формы в payload создания content source.
 */
export function toCreateContentSourceRequest(
  values: ContentSourceFormValues,
): CreateContentSourceRequest {
  const normalizedValues = normalizeContentSourceFormValues(values)
  const request: CreateContentSourceRequest = {
    displayName: normalizedValues.displayName,
    platform: getRequiredValue(normalizedValues.platform, 'platform'),
    url: normalizeHttpUrl(values.url),
  }

  assignOptionalCreateField(request, 'channelId', normalizedValues.channelId)
  assignOptionalCreateField(request, 'externalId', normalizedValues.externalId)
  assignOptionalCreateField(request, 'handle', normalizedValues.handle)

  return request
}

/**
 * Преобразует значения формы редактирования в частичный `PATCH` payload.
 *
 * @remarks Пустые optional поля превращаются в `null`, если это явная очистка серверного значения.
 */
export function toUpdateContentSourceRequest(
  values: ContentSourceFormValues,
  initialValues: ContentSourceFormValues,
): UpdateContentSourceRequest {
  const normalizedValues = normalizeContentSourceFormValues(values)
  const normalizedInitialValues =
    normalizeContentSourceFormValues(initialValues)
  const request: UpdateContentSourceRequest = {}

  if (normalizedValues.displayName !== normalizedInitialValues.displayName) {
    request.displayName = normalizedValues.displayName
  }

  if (normalizedValues.url !== normalizedInitialValues.url) {
    request.url = normalizeHttpUrl(values.url)
  }

  if (normalizedValues.externalId !== normalizedInitialValues.externalId) {
    request.externalId = normalizedValues.externalId
  }

  if (normalizedValues.handle !== normalizedInitialValues.handle) {
    request.handle = normalizedValues.handle
  }

  if (normalizedValues.channelId !== normalizedInitialValues.channelId) {
    request.channelId = normalizedValues.channelId
  }

  return request
}

/**
 * Проверяет, отличается ли форма content source от серверных значений после нормализации.
 */
export function hasContentSourceFormChanges(
  values: ContentSourceFormValues,
  initialValues: ContentSourceFormValues,
) {
  return getContentSourceFormChangedFields(values, initialValues).length > 0
}

/**
 * Возвращает список измененных полей формы content source для edit drawer.
 */
export function getContentSourceFormChangedFields(
  values: ContentSourceFormValues,
  initialValues: ContentSourceFormValues,
): ContentSourceFormChangedField[] {
  const normalizedValues = normalizeContentSourceFormValues(values)
  const normalizedInitialValues =
    normalizeContentSourceFormValues(initialValues)

  return contentSourceFormFieldKeys.flatMap((field) => {
    const label = contentSourceFormFieldLabels[field]

    if (normalizedValues[field] === normalizedInitialValues[field]) {
      return []
    }

    return [{ key: field, label }]
  })
}
