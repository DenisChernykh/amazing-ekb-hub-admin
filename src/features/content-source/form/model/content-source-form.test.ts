import type { ContentSource } from '@/shared/api/generated/model'
import { describe, expect, it } from 'vitest'
import {
  getContentSourceFormChangedFields,
  getContentSourceFormInitialValues,
  hasContentSourceFormChanges,
  toCreateContentSourceRequest,
  toUpdateContentSourceRequest,
} from './content-source-form'

const contentSource: ContentSource = {
  channelId: '-100123',
  createdAt: '2026-06-15T10:00:00.000Z',
  displayName: 'Amazing EKB Telegram',
  externalId: 'amazing_ekb',
  handle: 'amazing_ekb',
  id: 'source-1',
  lastCursor: null,
  lastImportedAt: null,
  platform: 'telegram',
  status: 'active',
  updatedAt: '2026-06-15T10:00:00.000Z',
  url: 'https://t.me/amazing_ekb',
}

describe('content source form helpers', () => {
  it('builds normalized create payload with trimmed optional fields', () => {
    expect(
      toCreateContentSourceRequest({
        channelId: ' -100123 ',
        displayName: ' Amazing EKB Telegram ',
        externalId: '',
        handle: ' amazing_ekb ',
        platform: 'telegram',
        url: ' https://t.me/amazing_ekb ',
      }),
    ).toEqual({
      channelId: '-100123',
      displayName: 'Amazing EKB Telegram',
      handle: 'amazing_ekb',
      platform: 'telegram',
      url: 'https://t.me/amazing_ekb',
    })
  })

  it('maps source to initial form values', () => {
    expect(getContentSourceFormInitialValues(contentSource)).toEqual({
      channelId: '-100123',
      displayName: 'Amazing EKB Telegram',
      externalId: 'amazing_ekb',
      handle: 'amazing_ekb',
      platform: 'telegram',
      url: 'https://t.me/amazing_ekb',
    })
  })

  it('builds update payload with changed fields and explicit null clears', () => {
    const initialValues = getContentSourceFormInitialValues(contentSource)

    expect(
      toUpdateContentSourceRequest(
        {
          ...initialValues,
          channelId: '',
          displayName: ' Amazing EKB ',
          externalId: '',
          handle: 'new_handle',
        },
        initialValues,
      ),
    ).toEqual({
      channelId: null,
      displayName: 'Amazing EKB',
      externalId: null,
      handle: 'new_handle',
    })
  })

  it('detects changed fields after normalization', () => {
    const initialValues = getContentSourceFormInitialValues(contentSource)

    expect(
      hasContentSourceFormChanges(
        {
          ...initialValues,
          displayName: 'Amazing EKB Telegram',
        },
        initialValues,
      ),
    ).toBe(false)
    expect(
      getContentSourceFormChangedFields(
        {
          ...initialValues,
          url: 'https://t.me/amazing_ekb_new',
        },
        initialValues,
      ),
    ).toEqual([{ key: 'url', label: 'Ссылка' }])
  })

  it('throws on unsafe source URLs before API submission', () => {
    expect(() =>
      toCreateContentSourceRequest({
        displayName: 'Unsafe',
        platform: 'telegram',
        url: 'javascript://example.com/%0Aalert(1)',
      }),
    ).toThrow('http или https')
  })
})
