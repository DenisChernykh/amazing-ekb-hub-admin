import { describe, expect, it } from 'vitest'
import {
  getHttpUrlValidationError,
  isSafeHttpUrl,
  normalizeHttpUrl,
} from './safe-url'

describe('safe URL helpers', () => {
  it('allows absolute http and https URLs', () => {
    expect(isSafeHttpUrl('https://t.me/amazing_ekb')).toBe(true)
    expect(isSafeHttpUrl(' http://example.com/source ')).toBe(true)
  })

  it.each([
    'javascript://example.com/%0Aalert(1)',
    'data:text/html,<script>alert(1)</script>',
    '//example.com/source',
    '/relative/source',
  ])('rejects unsafe URL "%s"', (url) => {
    expect(isSafeHttpUrl(url)).toBe(false)
    expect(getHttpUrlValidationError(url)).toMatch(/http или https/)
  })

  it('leaves empty values to required form validation', () => {
    expect(isSafeHttpUrl('')).toBe(false)
    expect(getHttpUrlValidationError('')).toBeNull()
  })

  it('normalizes allowed URLs before API payloads', () => {
    expect(normalizeHttpUrl('  https://t.me/amazing_ekb  ')).toBe(
      'https://t.me/amazing_ekb',
    )
  })

  it('throws when payload receives an unsafe URL', () => {
    expect(() =>
      normalizeHttpUrl('javascript://example.com/%0Aalert(1)'),
    ).toThrow('http или https')
  })
})
