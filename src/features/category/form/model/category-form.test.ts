import type { AdminPlaceCategory } from '@/shared/api/generated/model'
import {
  CreatePlaceCategoryBody,
  UpdatePlaceCategoryBody,
} from '@/shared/api/generated-zod/admin/admin.zod'
import { describe, expect, it } from 'vitest'
import {
  getCategoryFormChangedFields,
  getCategoryFormInitialValues,
  hasCategoryFormChanges,
  toCreateCategoryRequest,
  toUpdateCategoryRequest,
} from './category-form'
import {
  createCategoryFormSchema,
  editCategoryFormSchema,
} from './category-form-schema'

const category: AdminPlaceCategory = {
  createdAt: '2026-07-03T10:00:00.000Z',
  coverImageUrl: null,
  id: 'category_spa',
  slug: 'spa',
  status: 'active',
  title: 'SPA',
  updatedAt: '2026-07-03T10:00:00.000Z',
}

describe('category form helpers', () => {
  it('requires a create category title', () => {
    expect(
      createCategoryFormSchema.safeParse({ slug: '', title: '' }).error
        ?.issues[0]?.message,
    ).toBe('Введите название')
  })

  it('requires an edit category slug', () => {
    expect(
      editCategoryFormSchema.safeParse({ slug: '', title: 'SPA' }).error
        ?.issues[0]?.message,
    ).toBe('Введите ярлык')
  })

  it('rejects an edit category slug outside the API contract', () => {
    expect(
      editCategoryFormSchema.safeParse({
        slug: 'Семейное кафе',
        title: 'SPA',
      }).error?.issues[0]?.message,
    ).toBe(
      'Используйте маленькие латинские буквы, цифры и дефисы, например family-cafe',
    )
  })

  it('builds normalized create payload with optional slug', () => {
    const request = toCreateCategoryRequest({
      slug: ' spa ',
      title: ' SPA ',
    })

    expect(request).toEqual({
      slug: 'spa',
      title: 'SPA',
    })
    expect(CreatePlaceCategoryBody.parse(request)).toEqual(request)

    const requestWithoutSlug = toCreateCategoryRequest({
      slug: '',
      title: 'Бассейны',
    })

    expect(requestWithoutSlug).toEqual({
      title: 'Бассейны',
    })
    expect(CreatePlaceCategoryBody.parse(requestWithoutSlug)).toEqual(
      requestWithoutSlug,
    )
  })

  it('maps category to initial form values', () => {
    expect(getCategoryFormInitialValues(category)).toEqual({
      slug: 'spa',
      title: 'SPA',
    })
  })

  it('builds update payload with changed fields only', () => {
    const initialValues = getCategoryFormInitialValues(category)
    const request = toUpdateCategoryRequest(
      {
        ...initialValues,
        title: ' New SPA ',
      },
      initialValues,
    )

    expect(request).toEqual({
      title: 'New SPA',
    })
    expect(UpdatePlaceCategoryBody.parse(request)).toEqual(request)
  })

  it('detects changed fields after normalization', () => {
    const initialValues = getCategoryFormInitialValues(category)

    expect(
      hasCategoryFormChanges(
        {
          ...initialValues,
          title: ' SPA ',
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

})
