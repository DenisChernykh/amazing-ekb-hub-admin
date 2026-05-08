import { describe, expect, it } from 'vitest'
import {
  formatMaterialDuration,
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
})
