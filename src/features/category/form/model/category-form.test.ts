import type { AdminPlaceCategory } from '@/shared/api/generated/model'
import { describe, expect, it } from 'vitest'
import {
  getCategoryColorValidationError,
  getCategoryFormChangedFields,
  getCategoryFormInitialValues,
  getCategorySlugValidationError,
  hasCategoryFormChanges,
  toCreateCategoryRequest,
  toUpdateCategoryRequest,
} from './category-form'

const category: AdminPlaceCategory = {
  badgeBackgroundColor: '#faf0ed',
  createdAt: '2026-07-03T10:00:00.000Z',
  id: 'category_spa',
  slug: 'spa',
  title: 'SPA',
  updatedAt: '2026-07-03T10:00:00.000Z',
}

describe('category form helpers', () => {
  it('builds normalized create payload with optional slug', () => {
    expect(
      toCreateCategoryRequest({
        badgeBackgroundColor: ' #FAF0ED ',
        slug: ' spa ',
        title: ' SPA ',
      }),
    ).toEqual({
      badgeBackgroundColor: '#faf0ed',
      slug: 'spa',
      title: 'SPA',
    })

    expect(
      toCreateCategoryRequest({
        badgeBackgroundColor: '#DBEAFE',
        slug: '',
        title: 'Бассейны',
      }),
    ).toEqual({
      badgeBackgroundColor: '#dbeafe',
      title: 'Бассейны',
    })
  })

  it('maps category to initial form values', () => {
    expect(getCategoryFormInitialValues(category)).toEqual({
      badgeBackgroundColor: '#faf0ed',
      slug: 'spa',
      title: 'SPA',
    })
  })

  it('builds update payload with changed fields only', () => {
    const initialValues = getCategoryFormInitialValues(category)

    expect(
      toUpdateCategoryRequest(
        {
          ...initialValues,
          badgeBackgroundColor: '#DBEAFE',
          title: ' New SPA ',
        },
        initialValues,
      ),
    ).toEqual({
      badgeBackgroundColor: '#dbeafe',
      title: 'New SPA',
    })
  })

  it('detects changed fields after normalization', () => {
    const initialValues = getCategoryFormInitialValues(category)

    expect(
      hasCategoryFormChanges(
        {
          ...initialValues,
          badgeBackgroundColor: ' #FAF0ED ',
        },
        initialValues,
      ),
    ).toBe(false)
    expect(
      getCategoryFormChangedFields(
        {
          ...initialValues,
          slug: 'new-spa',
        },
        initialValues,
      ),
    ).toEqual([{ key: 'slug', label: 'Ярлык' }])
  })

  it('returns user-facing HEX validation errors', () => {
    expect(getCategoryColorValidationError('')).toBe('Введите HEX-цвет')
    expect(getCategoryColorValidationError('#fff')).toBe(
      'Укажите цвет в формате #RRGGBB',
    )
    expect(getCategoryColorValidationError('#FAF0ED')).toBeNull()
  })

  it('returns user-facing slug validation errors', () => {
    expect(getCategorySlugValidationError('')).toBeNull()
    expect(getCategorySlugValidationError('Семейное кафе')).toBe(
      'Используйте маленькие латинские буквы, цифры и дефисы, например family-cafe',
    )
    expect(getCategorySlugValidationError('family-cafe')).toBeNull()
  })
})
