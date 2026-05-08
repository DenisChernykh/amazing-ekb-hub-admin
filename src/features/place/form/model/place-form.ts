import type {
  CreatePlaceRequest,
  PlaceCategory,
  PlaceDetail,
  UpdatePlaceRequest,
} from '@/shared/api/generated/model'

/**
 * Значения общей формы создания и редактирования места.
 */
export type PlaceFormValues = {
  category: PlaceCategory
  popularityWeight?: number | null
  summary: string
  tags: string[]
  title: string
}

type NormalizedPlaceFormValues = {
  category: PlaceCategory
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
  category: values.category,
  popularityWeight: values.popularityWeight ?? null,
  summary: values.summary.trim(),
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
    category: place.category,
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
    category: normalizedValues.category,
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

  if (normalizedValues.category !== normalizedInitialValues.category) {
    request.category = normalizedValues.category
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
    normalizedValues.category !== normalizedInitialValues.category ||
    normalizedValues.popularityWeight !==
      normalizedInitialValues.popularityWeight
  )
}
