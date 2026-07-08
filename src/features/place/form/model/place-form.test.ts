import type { PlaceCategory, PlaceDetail } from '@/shared/api/generated/model'
import { describe, expect, it } from 'vitest'
import {
  getPlaceFormInitialValues,
  hasPlaceFormChanges,
  toCreatePlaceRequest,
  toUpdatePlaceRequest,
  type PlaceFormValues,
} from './place-form'

const spaCategory: PlaceCategory = {
  badgeBackgroundColor: '#faf0ed',
  id: 'category_spa',
  slug: 'spa',
  title: 'SPA',
}

const cafeCategory: PlaceCategory = {
  badgeBackgroundColor: '#fef3c7',
  id: 'category_cafe',
  slug: 'cafe',
  title: 'Кафе',
}

const place: PlaceDetail = {
  category: spaCategory,
  counters: {
    dzen: 1,
    instagram: 0,
    telegram: 2,
  },
  coverImageUrl: null,
  id: 'place-1',
  pinnedMaterial: null,
  popularityWeight: 7,
  status: 'active',
  summary: 'SPA в центре',
  tags: ['spa', 'relax'],
  title: 'Тихий SPA',
}

describe('place form helpers', () => {
  it('maps place detail to form initial values', () => {
    expect(getPlaceFormInitialValues(place)).toEqual({
      categoryId: 'category_spa',
      popularityWeight: 7,
      summary: 'SPA в центре',
      tags: ['spa', 'relax'],
      title: 'Тихий SPA',
    })
  })

  it('normalizes create payload values', () => {
    const values: PlaceFormValues = {
      categoryId: 'category_spa',
      popularityWeight: null,
      summary: '  Новый SPA в центре  ',
      tags: [' spa ', '', 'relax'],
      title: '  Тихий SPA  ',
    }

    expect(toCreatePlaceRequest(values)).toEqual({
      categoryId: 'category_spa',
      summary: 'Новый SPA в центре',
      tags: ['spa', 'relax'],
      title: 'Тихий SPA',
    })
  })

  it('keeps empty optional summary and tags in create payload', () => {
    const values: PlaceFormValues = {
      categoryId: 'category_spa',
      title: '  Тихий SPA  ',
    }

    expect(toCreatePlaceRequest(values)).toEqual({
      categoryId: 'category_spa',
      summary: '',
      tags: [],
      title: 'Тихий SPA',
    })
  })

  it('builds partial update payload only from changed normalized fields', () => {
    const initialValues = getPlaceFormInitialValues(place)
    const values: PlaceFormValues = {
      ...initialValues,
      categoryId: cafeCategory.id,
      popularityWeight: 11,
      summary: '  SPA с обновленным описанием  ',
      tags: [' spa ', 'city'],
      title: '  Тихий SPA  ',
    }

    expect(toUpdatePlaceRequest(values, initialValues)).toEqual({
      categoryId: 'category_cafe',
      popularityWeight: 11,
      summary: 'SPA с обновленным описанием',
      tags: ['spa', 'city'],
    })
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
    expect(toUpdatePlaceRequest(values, initialValues)).toEqual({})
  })

  it('builds update payload for cleared optional summary and tags', () => {
    const initialValues = getPlaceFormInitialValues(place)
    const values: PlaceFormValues = {
      ...initialValues,
      summary: '   ',
      tags: [],
    }

    expect(hasPlaceFormChanges(values, initialValues)).toBe(true)
    expect(toUpdatePlaceRequest(values, initialValues)).toEqual({
      summary: '',
      tags: [],
    })
  })
})
