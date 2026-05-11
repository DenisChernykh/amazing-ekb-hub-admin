import { describe, expect, it } from 'vitest'
import {
  getMaterialUrlValidationError,
  isSafeMaterialUrl,
  normalizeMaterialUrl,
} from './material-url'

describe('material URL helpers', () => {
  it('allows absolute http and https material URLs', () => {
    expect(isSafeMaterialUrl('https://t.me/amazing_ekb/321')).toBe(true)
    expect(isSafeMaterialUrl(' http://example.com/material ')).toBe(true)
  })

  it.each([
    'javascript://example.com/%0Aalert(1)',
    'data:text/html,<script>alert(1)</script>',
    '//example.com/material',
    '/relative/material',
  ])('rejects unsafe material URL "%s"', (url) => {
    expect(isSafeMaterialUrl(url)).toBe(false)
    expect(getMaterialUrlValidationError(url)).toMatch(/http или https/)
  })

  it('leaves empty values to required form validation', () => {
    expect(isSafeMaterialUrl('')).toBe(false)
    expect(getMaterialUrlValidationError('')).toBeNull()
  })

  it('normalizes allowed URLs before API payloads', () => {
    expect(normalizeMaterialUrl('  https://t.me/amazing_ekb/321  ')).toBe(
      'https://t.me/amazing_ekb/321',
    )
  })

  it('throws when API payload receives an unsafe URL', () => {
    expect(() =>
      normalizeMaterialUrl('javascript://example.com/%0Aalert(1)'),
    ).toThrow('http или https')
  })
})
