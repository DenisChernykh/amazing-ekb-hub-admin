import type {
  CreatePlaceRequest,
  PlaceDetail,
  UpdatePlaceRequest,
} from '@/shared/api/generated/model'

/**
 * Значения общей формы создания и редактирования места.
 *
 * @remarks `summary` и `tags` опциональны в UI и нормализуются в пустую строку
 * и пустой массив перед отправкой, чтобы create/edit одинаково поддерживали
 * незаполненные и явно очищенные поля.
 */
export type PlaceFormValues = {
  categoryId: string
  popularityWeight?: number | null
  summary?: string
  tags?: string[]
  title: string
}

type NormalizedPlaceFormValues = {
  categoryId: string
  popularityWeight: number | null
  summary: string
  tags: string[]
  title: string
}

const normalizeTags = (tags: string[] | undefined) =>
  tags?.map((tag) => tag.trim()).filter(Boolean) ?? []

const normalizePlaceFormValues = (
  values: PlaceFormValues,
): NormalizedPlaceFormValues => ({
  categoryId: values.categoryId,
  popularityWeight: values.popularityWeight ?? null,
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
export function getPlaceFormInitialValues(place: PlaceDetail): PlaceFormValues {
  return {
    categoryId: place.category.id,
    popularityWeight: place.popularityWeight,
    summary: place.summary,
    tags: place.tags,
    title: place.title,
  }
}

/**
 * Преобразует значения формы в payload создания места.
 */
export function toCreatePlaceRequest(
  values: PlaceFormValues,
): CreatePlaceRequest {
  const normalizedValues = normalizePlaceFormValues(values)

  return {
    categoryId: normalizedValues.categoryId,
    popularityWeight: normalizedValues.popularityWeight ?? undefined,
    summary: normalizedValues.summary,
    tags: normalizedValues.tags,
    title: normalizedValues.title,
  }
}

/**
 * Преобразует значения формы редактирования в частичный `PATCH` payload.
 *
 * @remarks В payload попадают только поля, изменившиеся после нормализации.
 */
export function toUpdatePlaceRequest(
  values: PlaceFormValues,
  initialValues: PlaceFormValues,
): UpdatePlaceRequest {
  const normalizedValues = normalizePlaceFormValues(values)
  const normalizedInitialValues = normalizePlaceFormValues(initialValues)
  const request: UpdatePlaceRequest = {}

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
    request.categoryId = normalizedValues.categoryId
  }

  if (
    normalizedValues.popularityWeight !== null &&
    normalizedValues.popularityWeight !==
      normalizedInitialValues.popularityWeight
  ) {
    request.popularityWeight = normalizedValues.popularityWeight
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
    normalizedValues.popularityWeight !==
      normalizedInitialValues.popularityWeight
  )
}
