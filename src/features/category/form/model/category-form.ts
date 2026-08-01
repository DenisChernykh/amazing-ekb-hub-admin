import type {
  CreatePlaceCategoryDto,
  PlaceCategoryResponseDto,
  UpdatePlaceCategoryDto,
} from '@/shared/api'
import type { CategoryFormValues } from './category-form-schema'

export type { CategoryFormValues } from './category-form-schema'

type NormalizedCategoryFormValues = {
  slug: string | null
  title: string
}

/**
 * Поле категории, измененное в edit drawer после нормализации.
 */
export type CategoryFormChangedField = {
  key: keyof NormalizedCategoryFormValues
  label: string
}

const categoryFormFieldLabels = {
  slug: 'Ярлык',
  title: 'Название',
} satisfies Record<keyof NormalizedCategoryFormValues, string>

const categoryFormFieldKeys: Array<keyof NormalizedCategoryFormValues> = [
  'title',
  'slug',
]

const trimOptionalValue = (value: string) => {
  const trimmedValue = value.trim()

  return trimmedValue ? trimmedValue : null
}

const normalizeCategoryFormValues = (
  values: CategoryFormValues,
): NormalizedCategoryFormValues => ({
  slug: trimOptionalValue(values.slug),
  title: values.title.trim(),
})

const getRequiredValue = <T>(value: T | null, fieldName: string): T => {
  if (value === null) {
    throw new Error(`Category form field "${fieldName}" is required`)
  }

  return value
}

/**
 * Возвращает начальные значения формы из категории места.
 */
export function getCategoryFormInitialValues(
  category: PlaceCategoryResponseDto,
): CategoryFormValues {
  return {
    slug: category.slug,
    title: category.title,
  }
}

/**
 * Преобразует значения формы в payload создания категории места.
 */
export function toCreateCategoryRequest(
  values: CategoryFormValues,
): CreatePlaceCategoryDto {
  const normalizedValues = normalizeCategoryFormValues(values)
  const request: CreatePlaceCategoryDto = {
    title: normalizedValues.title,
  }

  if (normalizedValues.slug !== null) {
    request.slug = normalizedValues.slug
  }

  return request
}

/**
 * Преобразует значения формы редактирования в частичный `PATCH` payload.
 */
export function toUpdateCategoryRequest(
  values: CategoryFormValues,
  initialValues: CategoryFormValues,
): UpdatePlaceCategoryDto {
  const normalizedValues = normalizeCategoryFormValues(values)
  const normalizedInitialValues = normalizeCategoryFormValues(initialValues)
  const request: UpdatePlaceCategoryDto = {}

  if (normalizedValues.title !== normalizedInitialValues.title) {
    request.title = normalizedValues.title
  }

  if (normalizedValues.slug !== normalizedInitialValues.slug) {
    request.slug = getRequiredValue(normalizedValues.slug, 'slug')
  }

  return request
}

/**
 * Проверяет, отличается ли форма категории от серверных значений после нормализации.
 */
export function hasCategoryFormChanges(
  values: CategoryFormValues,
  initialValues: CategoryFormValues,
) {
  return getCategoryFormChangedFields(values, initialValues).length > 0
}

/**
 * Возвращает список измененных полей формы категории для edit drawer.
 */
export function getCategoryFormChangedFields(
  values: CategoryFormValues,
  initialValues: CategoryFormValues,
): CategoryFormChangedField[] {
  const normalizedValues = normalizeCategoryFormValues(values)
  const normalizedInitialValues = normalizeCategoryFormValues(initialValues)

  return categoryFormFieldKeys.flatMap((field) => {
    const label = categoryFormFieldLabels[field]

    if (normalizedValues[field] === normalizedInitialValues[field]) {
      return []
    }

    return [{ key: field, label }]
  })
}
