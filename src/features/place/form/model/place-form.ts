import type {
  CreatePlaceDto,
  PlaceDetailResponseDto,
  UpdatePlaceDto,
} from '@/shared/api'
import { z } from 'zod'
import { editPlaceFormSchema } from './place-form-schema'

/**
 * Значения общей формы создания и редактирования места.
 *
 * @remarks `summary` и `tags` опциональны в UI и нормализуются в пустую строку
 * и пустой массив перед отправкой, чтобы create/edit одинаково поддерживали
 * незаполненные и явно очищенные поля.
 */
export type PlaceFormValues = z.input<typeof editPlaceFormSchema>

type NormalizedPlaceFormValues = {
  categoryId: string | null
  slug: string | null
  summary: string
  tags: string[]
  title: string
}

const normalizeTags = (tags: string[] | undefined) =>
  tags?.map((tag) => tag.trim()).filter(Boolean) ?? []

const trimOptionalValue = (value: string | undefined) => {
  const trimmedValue = (value ?? '').trim()

  return trimmedValue ? trimmedValue : null
}

const getRequiredValue = <T>(value: T | null, fieldName: string): T => {
  if (value === null) {
    throw new Error(`Place form field "${fieldName}" is required`)
  }

  return value
}

const normalizePlaceFormValues = (
  values: PlaceFormValues,
): NormalizedPlaceFormValues => ({
  categoryId: values.categoryId,
  slug: trimOptionalValue(values.slug),
  summary: (values.summary ?? '').trim(),
  tags: normalizeTags(values.tags),
  title: values.title.trim(),
})

const areTagsEqual = (left: string[], right: string[]) => {
  return (
    left.length === right.length &&
    left.every((tag, index) => tag === right[index])
  )
}

/**
 * Возвращает начальные значения формы из admin detail места.
 */
export function getPlaceFormInitialValues(
  place: PlaceDetailResponseDto,
): PlaceFormValues {
  return {
    categoryId: place.category.id,
    slug: place.slug,
    summary: place.summary,
    tags: place.tags,
    title: place.title,
  }
}

/**
 * Преобразует значения формы в payload создания места.
 */
export function toCreatePlaceRequest(values: PlaceFormValues): CreatePlaceDto {
  const normalizedValues = normalizePlaceFormValues(values)

  const request: CreatePlaceDto = {
    categoryId: getRequiredValue(normalizedValues.categoryId, 'categoryId'),
    summary: normalizedValues.summary,
    tags: normalizedValues.tags,
    title: normalizedValues.title,
  }

  if (normalizedValues.slug !== null) {
    request.slug = normalizedValues.slug
  }

  return request
}

/**
 * Преобразует значения формы редактирования в частичный `PATCH` payload.
 *
 * @remarks В payload попадают только поля, изменившиеся после нормализации.
 */
export function toUpdatePlaceRequest(
  values: PlaceFormValues,
  initialValues: PlaceFormValues,
): UpdatePlaceDto {
  const normalizedValues = normalizePlaceFormValues(values)
  const normalizedInitialValues = normalizePlaceFormValues(initialValues)
  const request: UpdatePlaceDto = {}

  if (normalizedValues.title !== normalizedInitialValues.title) {
    request.title = normalizedValues.title
  }

  if (normalizedValues.summary !== normalizedInitialValues.summary) {
    request.summary = normalizedValues.summary
  }

  if (!areTagsEqual(normalizedValues.tags, normalizedInitialValues.tags)) {
    request.tags = normalizedValues.tags
  }

  if (normalizedValues.categoryId !== normalizedInitialValues.categoryId) {
    request.categoryId = getRequiredValue(
      normalizedValues.categoryId,
      'categoryId',
    )
  }

  if (normalizedValues.slug !== normalizedInitialValues.slug) {
    if (normalizedValues.slug === null) {
      throw new Error('Place form field "slug" is required')
    }

    request.slug = normalizedValues.slug
  }

  return request
}

/**
 * Проверяет, отличается ли форма от серверных значений после нормализации.
 */
export function hasPlaceFormChanges(
  values: PlaceFormValues,
  initialValues: PlaceFormValues,
) {
  const normalizedValues = normalizePlaceFormValues(values)
  const normalizedInitialValues = normalizePlaceFormValues(initialValues)

  return (
    normalizedValues.title !== normalizedInitialValues.title ||
    normalizedValues.summary !== normalizedInitialValues.summary ||
    !areTagsEqual(normalizedValues.tags, normalizedInitialValues.tags) ||
    normalizedValues.categoryId !== normalizedInitialValues.categoryId ||
    normalizedValues.slug !== normalizedInitialValues.slug
  )
}
