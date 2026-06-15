import { describe, expect, it } from 'vitest'
import { getSelectedNavigationKey } from './navigation'

describe('getSelectedNavigationKey', () => {
  it('selects materials navigation on material library route', () => {
    expect(getSelectedNavigationKey('/materials')).toBe('materials')
  })

  it('keeps places navigation selected on nested place routes', () => {
    expect(getSelectedNavigationKey('/places/place-1')).toBe('places')
  })
})
