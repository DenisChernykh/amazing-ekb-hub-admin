import { describe, expect, it } from 'vitest'
import { formatEkaterinburgDateTime } from './format-ekaterinburg-date-time'

describe('formatEkaterinburgDateTime', () => {
  it.each([
    ['2026-07-21T17:34:14.848Z', '2026-07-21 22:34 ЕКБ'],
    ['2026-07-21T22:34:14.848+05:00', '2026-07-21 22:34 ЕКБ'],
    ['2026-12-31T20:15:00.000Z', '2027-01-01 01:15 ЕКБ'],
    ['2026-07-21T19:00:00.000Z', '2026-07-22 00:00 ЕКБ'],
  ])('formats %s in the fixed city time zone', (value, expected) => {
    expect(formatEkaterinburgDateTime(value)).toBe(expected)
  })

  it.each([null, '', 'not-a-date'])('returns a dash for %j', (value) => {
    expect(formatEkaterinburgDateTime(value)).toBe('—')
  })
})
