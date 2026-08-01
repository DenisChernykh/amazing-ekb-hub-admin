import type { PlaceCategoryResponseDto } from '@/shared/api'
import { describe, expect, it } from 'vitest'
import {
  getPlaceCategoryMeta,
  getPlaceCategoryOptions,
  getPlaceStatusMeta,
} from './place-meta'

const categories = [
  {
    coverImageUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    updatedAt: '2026-01-01T00:00:00.000Z',
    id: 'category_pools',
    slug: 'pools',
    title: 'Бассейны',
  },
  {
    coverImageUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    updatedAt: '2026-01-01T00:00:00.000Z',
    id: 'category_spa',
    slug: 'spa',
    title: 'SPA',
  },
] satisfies PlaceCategoryResponseDto[]

describe('place meta', () => {
  it('returns localized category labels', () => {
    expect(getPlaceCategoryMeta(categories[0])).toMatchObject({
      color: 'default',
      label: 'Бассейны',
    })
  })

  it('returns localized status labels', () => {
    expect(getPlaceStatusMeta('active')).toMatchObject({
      label: 'Опубликовано',
    })
  })

  it('returns category options for form controls', () => {
    expect(getPlaceCategoryOptions(categories)).toEqual([
      { label: 'Бассейны', value: 'category_pools' },
      { label: 'SPA', value: 'category_spa' },
    ])
  })
})
