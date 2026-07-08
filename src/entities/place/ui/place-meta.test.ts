import { describe, expect, it } from 'vitest'
import {
  getPlaceCategoryMeta,
  getPlaceCategoryOptions,
  getPlaceStatusMeta,
} from './place-meta'

const categories = [
  {
    badgeBackgroundColor: '#dbeafe',
    id: 'category_pools',
    slug: 'pools',
    title: 'Бассейны',
  },
  {
    badgeBackgroundColor: '#faf0ed',
    id: 'category_spa',
    slug: 'spa',
    title: 'SPA',
  },
]

describe('place meta', () => {
  it('returns localized category labels', () => {
    expect(getPlaceCategoryMeta(categories[0])).toMatchObject({
      color: '#dbeafe',
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
