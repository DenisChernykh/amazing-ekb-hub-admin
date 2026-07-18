import { describe, expect, it } from 'vitest'
import { isValidSlug } from './slug'

describe('isValidSlug', () => {
  it('accepts lowercase slugs with digits and single hyphens', () => {
    expect(isValidSlug('family-cafe-2')).toBe(true)
  })

  it('rejects uppercase, whitespace, and repeated hyphens', () => {
    expect(isValidSlug('Family-cafe')).toBe(false)
    expect(isValidSlug('family cafe')).toBe(false)
    expect(isValidSlug('family--cafe')).toBe(false)
  })
})
