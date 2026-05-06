import { describe, expect, it } from 'vitest'
import { getPlaceStatusFromValue } from './place-status'

describe('getPlaceStatusFromValue', () => {
  it('returns backend place status for supported values', () => {
    expect(getPlaceStatusFromValue('active')).toBe('active')
    expect(getPlaceStatusFromValue('hidden')).toBe('hidden')
  })

  it('returns null for unsupported values', () => {
    expect(getPlaceStatusFromValue('all')).toBe(null)
    expect(getPlaceStatusFromValue(1)).toBe(null)
    expect(getPlaceStatusFromValue(null)).toBe(null)
  })
})
