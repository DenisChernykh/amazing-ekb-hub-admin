import { describe, expect, it } from 'vitest'
import { parsePublicEnv } from './env'

describe('parsePublicEnv', () => {
  it('uses the same-origin root when the public variable is absent', () => {
    expect(parsePublicEnv({})).toEqual({ VITE_API_BASE_URL: '/' })
  })

  it.each([
    ['/', '/'],
    ['https://api.example.test', 'https://api.example.test'],
    ['https://api.example.test/', 'https://api.example.test'],
  ])('accepts API root %s', (input, expected) => {
    expect(parsePublicEnv({ VITE_API_BASE_URL: input })).toEqual({
      VITE_API_BASE_URL: expected,
    })
  })

  it.each([
    ['/v1'],
    ['api.example.test'],
    ['ftp://api.example.test'],
    ['https://api.example.test/backend'],
    ['https://api.example.test?tenant=1'],
    ['https://api.example.test#section'],
    ['https://user:password@api.example.test'],
  ])('rejects non-origin API value %s', (input) => {
    expect(() => parsePublicEnv({ VITE_API_BASE_URL: input })).toThrow()
  })
})
