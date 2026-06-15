import { describe, expect, it } from 'vitest'
import { getSelectedNavigationKey } from './navigation'

describe('getSelectedNavigationKey', () => {
  it('keeps places navigation selected on nested place routes', () => {
    expect(getSelectedNavigationKey('/places/place-1')).toBe('places')
  })
})
