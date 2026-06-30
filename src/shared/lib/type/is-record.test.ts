import { describe, expect, it } from 'vitest'
import { isRecord } from './is-record'

describe('isRecord', () => {
  it('narrows unknown plain object values to records', () => {
    expect(isRecord({ value: 'ok' })).toBe(true)
    expect(isRecord(Object.create(null))).toBe(true)
    expect(isRecord(null)).toBe(false)
    expect(isRecord(['value'])).toBe(false)
    expect(isRecord('value')).toBe(false)
  })
})
