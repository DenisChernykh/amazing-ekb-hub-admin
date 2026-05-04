import { describe, expect, it } from 'vitest'
import { getPlaceCategoryMeta, getPlaceStatusMeta } from './place-meta'

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
})
