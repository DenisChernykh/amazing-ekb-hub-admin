import {
  CreatePlaceBody,
  UpdatePlaceBody,
} from '@/shared/api/generated-zod/admin/admin.zod'
import type { PlaceCategory, PlaceDetail } from '@/shared/api/generated/model'
import { describe, expect, it } from 'vitest'
import {
  getPlaceFormInitialValues,
  hasPlaceFormChanges,
  toCreatePlaceRequest,
  toUpdatePlaceRequest,
  type PlaceFormValues,
} from './place-form'
import { createPlaceFormSchema, editPlaceFormSchema } from './place-form-schema'

const spaCategory: PlaceCategory = {
  coverImageUrl: null,
  id: 'category_spa',
  slug: 'spa',
  title: 'SPA',
}

const cafeCategory: PlaceCategory = {
  coverImageUrl: null,
  id: 'category_cafe',
  slug: 'cafe',
  title: 'Кафе',
}

const place: PlaceDetail = {
  mapsUrl: null,
  category: spaCategory,
  counters: {
    dzen: 1,
    instagram: 0,
    telegram: 2,
  },
  coverImageUrl: null,
  id: 'place-1',
  pinnedMaterial: null,
  slug: 'quiet-spa',
  status: 'active',
  summary: 'SPA в центре',
  tags: ['spa', 'relax'],
  title: 'Тихий SPA',
}

describe('place form helpers', () => {
  it('rejects empty required create fields', () => {
    expect(
      createPlaceFormSchema
        .safeParse({
          categoryId: null,
          slug: '',
          summary: '',
          tags: [],
          title: '',
        })
        .error?.issues.map((issue) => issue.message),
    ).toEqual(
      expect.arrayContaining(['Введите название', 'Выберите категорию']),
    )
  })

  it('requires a slug when editing a place', () => {
    expect(
      editPlaceFormSchema.safeParse({
        categoryId: 'category_spa',
        slug: '',
        summary: '',
        tags: [],
        title: 'SPA',
      }).error?.issues[0]?.message,
    ).toBe('Введите ярлык')
  })

  it('uses exact generated-backed slug guidance', () => {
    expect(
      createPlaceFormSchema.safeParse({
        categoryId: 'category_spa',
        slug: 'Тихий SPA',
        summary: '',
        tags: [],
        title: 'SPA',
      }).error?.issues[0]?.message,
    ).toBe(
      'Используйте маленькие латинские буквы, цифры и дефисы, например quiet-spa',
    )
  })

  it('maps place detail to form initial values', () => {
    expect(getPlaceFormInitialValues(place)).toEqual({
      categoryId: 'category_spa',
      slug: 'quiet-spa',
      summary: 'SPA в центре',
      tags: ['spa', 'relax'],
      title: 'Тихий SPA',
    })
  })

  it('normalizes create payload values', () => {
    const values: PlaceFormValues = {
      categoryId: 'category_spa',
      slug: ' new-quiet-spa ',
      summary: '  Новый SPA в центре  ',
      tags: [' spa ', '', 'relax'],
      title: '  Тихий SPA  ',
    }

    const request = toCreatePlaceRequest(values)

    expect(request).toEqual({
      categoryId: 'category_spa',
      slug: 'new-quiet-spa',
      summary: 'Новый SPA в центре',
      tags: ['spa', 'relax'],
      title: 'Тихий SPA',
    })
    expect(CreatePlaceBody.parse(request)).toEqual(request)
  })

  it('keeps empty optional summary and tags in create payload', () => {
    const values: PlaceFormValues = {
      categoryId: 'category_spa',
      slug: '',
      summary: '',
      title: '  Тихий SPA  ',
    }

    const request = toCreatePlaceRequest(values)

    expect(request).toEqual({
      categoryId: 'category_spa',
      summary: '',
      tags: [],
      title: 'Тихий SPA',
    })
    expect(CreatePlaceBody.parse(request)).toEqual(request)
  })

  it('builds partial update payload only from changed normalized fields', () => {
    const initialValues = getPlaceFormInitialValues(place)
    const values: PlaceFormValues = {
      ...initialValues,
      categoryId: cafeCategory.id,
      slug: 'quiet-spa-premium',
      summary: '  SPA с обновленным описанием  ',
      tags: [' spa ', 'city'],
      title: '  Тихий SPA  ',
    }

    const request = toUpdatePlaceRequest(values, initialValues)

    expect(request).toEqual({
      categoryId: 'category_cafe',
      slug: 'quiet-spa-premium',
      summary: 'SPA с обновленным описанием',
      tags: ['spa', 'city'],
    })
    expect(UpdatePlaceBody.parse(request)).toEqual(request)
  })

  it('treats whitespace-only differences as unchanged', () => {
    const initialValues = getPlaceFormInitialValues(place)
    const values: PlaceFormValues = {
      ...initialValues,
      summary: '  SPA в центре  ',
      tags: [' spa ', 'relax'],
      title: '  Тихий SPA  ',
    }

    expect(hasPlaceFormChanges(values, initialValues)).toBe(false)
    const request = toUpdatePlaceRequest(values, initialValues)

    expect(request).toEqual({})
    expect(UpdatePlaceBody.parse(request)).toEqual(request)
  })

  it('builds update payload for cleared optional summary and tags', () => {
    const initialValues = getPlaceFormInitialValues(place)
    const values: PlaceFormValues = {
      ...initialValues,
      summary: '   ',
      tags: [],
    }

    expect(hasPlaceFormChanges(values, initialValues)).toBe(true)
    const request = toUpdatePlaceRequest(values, initialValues)

    expect(request).toEqual({
      summary: '',
      tags: [],
    })
    expect(UpdatePlaceBody.parse(request)).toEqual(request)
  })
})
