import { describe, expect, it } from 'vitest'
import {
  CONTENT_SOURCE_PLATFORM_VALUES,
  CONTENT_SOURCE_STATUS_VALUES,
  formatContentSourceDateTime,
  getContentSourcePlatformMeta,
  getContentSourcePlatformOptions,
  getContentSourceStatusMeta,
  getContentSourceStatusOptions,
} from './content-source-meta'

describe('content source meta helpers', () => {
  it('keeps generated content source platforms in stable UI order', () => {
    expect(CONTENT_SOURCE_PLATFORM_VALUES).toEqual([
      'telegram',
      'dzen',
      'instagram',
      'tiktok',
      'vk',
      'pinterest',
    ])
  })

  it('maps platforms and statuses to localized options', () => {
    expect(getContentSourcePlatformMeta('telegram')).toMatchObject({
      color: 'blue',
      label: 'Telegram',
    })
    expect(getContentSourceStatusMeta('disabled')).toMatchObject({
      color: 'default',
      label: 'Отключен',
    })
    expect(getContentSourcePlatformOptions()).toContainEqual({
      label: 'VK',
      value: 'vk',
    })
    expect(getContentSourceStatusOptions()).toEqual([
      { label: 'Активен', value: 'active' },
      { label: 'Отключен', value: 'disabled' },
    ])
    expect(CONTENT_SOURCE_STATUS_VALUES).toEqual(['active', 'disabled'])
  })

  it('formats nullable source datetimes for compact table cells', () => {
    expect(formatContentSourceDateTime('2026-06-16T08:05:30.000Z')).toBe(
      '2026-06-16 08:05',
    )
    expect(formatContentSourceDateTime(null)).toBe('—')
  })
})
