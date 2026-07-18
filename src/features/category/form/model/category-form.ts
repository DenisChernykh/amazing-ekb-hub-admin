import type {
  AdminPlaceCategory,
  CreatePlaceCategoryRequest,
  UpdatePlaceCategoryRequest,
} from '@/shared/api/generated/model'
import { isValidSlug } from '@/shared/lib/slug/slug'

/**
 * Значения общей формы создания и редактирования категории места.
 *
 * @remarks Поля допускают `undefined`, пока Ant Design Form еще не прошла required-валидацию.
 */
export type CategoryFormValues = {
  slug?: string
  title?: string
}

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

const trimOptionalValue = (value: string | undefined) => {
  const trimmedValue = (value ?? '').trim()

  return trimmedValue ? trimmedValue : null
}

const normalizeCategoryFormValues = (
  values: CategoryFormValues,
): NormalizedCategoryFormValues => ({
  slug: trimOptionalValue(values.slug),
  title: (values.title ?? '').trim(),
})

const getRequiredValue = <T>(value: T | null, fieldName: string): T => {
  if (value === null) {
    throw new Error(`Category form field "${fieldName}" is required`)
  }

  return value
}

/**
 * Возвращает ошибку локальной проверки ярлыка категории.
 *
 * @returns `null`, если ярлык пустой или заполнен в backend-формате.
 */
export function getCategorySlugValidationError(value: string | undefined) {
  const normalizedValue = (value ?? '').trim()

  if (!normalizedValue) {
    return null
  }

  if (!isValidSlug(normalizedValue)) {
    return 'Используйте маленькие латинские буквы, цифры и дефисы, например family-cafe'
  }

  return null
}

/**
 * Возвращает начальные значения формы из категории места.
 */
export function getCategoryFormInitialValues(
  category: AdminPlaceCategory,
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
): CreatePlaceCategoryRequest {
  const normalizedValues = normalizeCategoryFormValues(values)
  const request: CreatePlaceCategoryRequest = {
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
): UpdatePlaceCategoryRequest {
  const normalizedValues = normalizeCategoryFormValues(values)
  const normalizedInitialValues = normalizeCategoryFormValues(initialValues)
  const request: UpdatePlaceCategoryRequest = {}

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
