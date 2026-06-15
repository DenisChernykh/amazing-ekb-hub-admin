import { describe, expect, it } from 'vitest'
import {
  formatMaterialDuration,
  formatMaterialMediaKind,
  formatMaterialPublishedDate,
  getMaterialAdminStatusMeta,
  getMaterialAdminStatusOptions,
  getMaterialLinkedMeta,
  getMaterialPlatformMeta,
  getMaterialPlatformOptions,
  getMaterialTypeMeta,
  getMaterialTypeOptions,
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

  it('returns material select options in stable order', () => {
    expect(getMaterialPlatformOptions()).toEqual([
      { label: 'Telegram', value: 'telegram' },
      { label: 'Дзен', value: 'dzen' },
      { label: 'Instagram', value: 'instagram' },
    ])
    expect(getMaterialTypeOptions()).toEqual([
      { label: 'Пост', value: 'post' },
      { label: 'Reels', value: 'reel' },
      { label: 'Видео', value: 'video' },
    ])
  })

  it('maps material admin statuses to localized labels and stable options', () => {
    expect(getMaterialAdminStatusMeta('pending')).toMatchObject({
      label: 'На проверке',
    })
    expect(getMaterialAdminStatusMeta('approved')).toMatchObject({
      label: 'Одобрено',
    })
    expect(getMaterialAdminStatusMeta('rejected')).toMatchObject({
      label: 'Отклонено',
    })
    expect(getMaterialAdminStatusMeta('archived')).toMatchObject({
      label: 'Архив',
    })
    expect(getMaterialAdminStatusOptions()).toEqual([
      { label: 'На проверке', value: 'pending' },
      { label: 'Одобрено', value: 'approved' },
      { label: 'Отклонено', value: 'rejected' },
      { label: 'Архив', value: 'archived' },
    ])
  })

  it('maps material library linked flag to localized metadata', () => {
    expect(getMaterialLinkedMeta(true)).toMatchObject({ label: 'Связан' })
    expect(getMaterialLinkedMeta(false)).toMatchObject({ label: 'Не связан' })
  })

  it('formats nullable imported media kind', () => {
    expect(formatMaterialMediaKind(null)).toBe('—')
    expect(formatMaterialMediaKind('photo')).toBe('Фото')
    expect(formatMaterialMediaKind('video')).toBe('Видео')
    expect(formatMaterialMediaKind('custom')).toBe('custom')
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
