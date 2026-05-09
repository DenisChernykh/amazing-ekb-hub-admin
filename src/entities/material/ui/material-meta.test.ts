import { describe, expect, it } from 'vitest'
import {
  formatMaterialDuration,
  formatMaterialPublishedDate,
  getMaterialPlatformMeta,
  getMaterialTypeMeta,
} from './material-meta'

describe('material meta', () => {
  it('maps material platforms to localized labels', () => {
    expect(getMaterialPlatformMeta('telegram')).toMatchObject({
      label: 'Telegram',
    })
    expect(getMaterialPlatformMeta('dzen')).toMatchObject({
      label: 'Дзен',
    })
    expect(getMaterialPlatformMeta('instagram')).toMatchObject({
      label: 'Instagram',
    })
  })

  it('maps material types to localized labels', () => {
    expect(getMaterialTypeMeta('post')).toMatchObject({ label: 'Пост' })
    expect(getMaterialTypeMeta('reel')).toMatchObject({ label: 'Reels' })
    expect(getMaterialTypeMeta('video')).toMatchObject({ label: 'Видео' })
  })

  it('formats nullable material duration', () => {
    expect(formatMaterialDuration(null)).toBe('—')
    expect(formatMaterialDuration(75)).toBe('1:15')
    expect(formatMaterialDuration(3670)).toBe('1:01:10')
  })

  it('formats material publication date without UTC day shift', () => {
    expect(formatMaterialPublishedDate('2026-03-20T00:30:00+03:00')).toBe(
      '2026-03-20',
    )
    expect(formatMaterialPublishedDate('2026-03-20T10:30:00.000Z')).toBe(
      '2026-03-20',
    )
  })
})
