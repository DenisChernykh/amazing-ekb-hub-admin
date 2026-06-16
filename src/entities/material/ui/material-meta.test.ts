import type { AdminMaterialLibraryItem } from '@/shared/api/generated/model'
import { describe, expect, it } from 'vitest'
import {
  formatMaterialDuration,
  formatMaterialMediaKind,
  formatMaterialPublishedDate,
  getMaterialAdminStatusMeta,
  getMaterialAdminStatusOptions,
  getMaterialLibraryPreviewText,
  getMaterialLibrarySourceTitle,
  getMaterialLinkedMeta,
  getMaterialPlatformMeta,
  getMaterialPlatformOptions,
  getMaterialTypeMeta,
  getMaterialTypeOptions,
  getSafeMaterialHref,
} from './material-meta'

const libraryMaterial: AdminMaterialLibraryItem = {
  adminStatus: 'approved',
  durationSec: null,
  excerpt: 'Короткий preview',
  externalId: '321',
  id: 'material-1',
  linked: false,
  mediaKind: 'photo',
  mediaPreviewUrl: null,
  platform: 'telegram',
  placeLink: null,
  publishedAt: '2026-03-20T10:30:00+05:00',
  source: {
    displayName: 'Amazing EKB Telegram',
    id: 'source-1',
    platform: 'telegram',
    url: 'https://t.me/amazing_ekb',
  },
  text: 'Полный текст материала',
  title: 'Заголовок материала',
  type: 'post',
  url: 'https://t.me/amazing_ekb/321',
}

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

  it('formats material library preview text with stable fallbacks', () => {
    expect(getMaterialLibraryPreviewText(libraryMaterial)).toBe(
      'Короткий preview',
    )
    expect(
      getMaterialLibraryPreviewText({
        ...libraryMaterial,
        excerpt: null,
      }),
    ).toBe('Заголовок материала')
    expect(
      getMaterialLibraryPreviewText({
        ...libraryMaterial,
        excerpt: null,
        title: null,
      }),
    ).toBe('Полный текст материала')
    expect(
      getMaterialLibraryPreviewText({
        ...libraryMaterial,
        excerpt: null,
        text: null,
        title: null,
      }),
    ).toBe('—')
  })

  it('formats material library source title with manual fallback', () => {
    expect(getMaterialLibrarySourceTitle(libraryMaterial)).toBe(
      'Amazing EKB Telegram',
    )
    expect(
      getMaterialLibrarySourceTitle({
        ...libraryMaterial,
        source: null,
      }),
    ).toBe('Ручной материал')
  })

  it('returns only safe material href values', () => {
    expect(getSafeMaterialHref('https://example.com/material')).toBe(
      'https://example.com/material',
    )
    expect(getSafeMaterialHref('javascript://example.com/%0Aalert(1)')).toBe(
      null,
    )
    expect(getSafeMaterialHref(null)).toBe(null)
  })
})
