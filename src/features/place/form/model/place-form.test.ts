import type { PlaceDetail } from '@/shared/api/generated/model'
import { describe, expect, it } from 'vitest'
import {
  getPlaceFormInitialValues,
  hasPlaceFormChanges,
  toCreatePlaceRequest,
  toUpdatePlaceRequest,
  type PlaceFormValues,
} from './place-form'

const place: PlaceDetail = {
  category: 'spa',
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
      category: 'spa',
      popularityWeight: 7,
      summary: 'SPA в центре',
      tags: ['spa', 'relax'],
      title: 'Тихий SPA',
    })
  })

  it('normalizes create payload values', () => {
    const values: PlaceFormValues = {
      category: 'spa',
      popularityWeight: null,
      summary: '  Новый SPA в центре  ',
      tags: [' spa ', '', 'relax'],
      title: '  Тихий SPA  ',
    }

    expect(toCreatePlaceRequest(values)).toEqual({
      category: 'spa',
      summary: 'Новый SPA в центре',
      tags: ['spa', 'relax'],
      title: 'Тихий SPA',
    })
  })

  it('keeps empty optional summary and tags in create payload', () => {
    const values: PlaceFormValues = {
      category: 'spa',
      title: '  Тихий SPA  ',
    }

    expect(toCreatePlaceRequest(values)).toEqual({
      category: 'spa',
      summary: '',
      tags: [],
      title: 'Тихий SPA',
    })
  })

  it('builds partial update payload only from changed normalized fields', () => {
    const initialValues = getPlaceFormInitialValues(place)
    const values: PlaceFormValues = {
      ...initialValues,
      category: 'cafe',
      popularityWeight: 11,
      summary: '  SPA с обновленным описанием  ',
      tags: [' spa ', 'city'],
      title: '  Тихий SPA  ',
    }

    expect(toUpdatePlaceRequest(values, initialValues)).toEqual({
      category: 'cafe',
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
