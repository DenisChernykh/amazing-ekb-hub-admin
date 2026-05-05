import { describe, expect, it } from 'vitest'
import {
  getPlaceCategoryMeta,
  getPlaceCategoryOptions,
  getPlaceStatusMeta,
} from './place-meta'

describe('place meta', () => {
  it('returns localized category labels', () => {
    expect(getPlaceCategoryMeta('pools')).toMatchObject({
      label: 'Бассейны',
    })
  })

  it('returns localized status labels', () => {
    expect(getPlaceStatusMeta('active')).toMatchObject({
      label: 'Опубликовано',
    })
  })

  it('returns category options for form controls', () => {
    expect(getPlaceCategoryOptions()).toEqual([
      { label: 'Бассейны', value: 'pools' },
      { label: 'SPA', value: 'spa' },
      { label: 'Кафе', value: 'cafe' },
      { label: 'Отели', value: 'hotels' },
      { label: 'Мастерские', value: 'workshops' },
    ])
  })
})
