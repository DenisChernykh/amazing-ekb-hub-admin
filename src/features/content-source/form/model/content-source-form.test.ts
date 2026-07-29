import {
  CreateContentSourceBody,
  UpdateContentSourceBody,
} from '@/shared/api/generated-zod/admin/admin.zod'
import type { ContentSource } from '@/shared/api/generated/model'
import { describe, expect, it } from 'vitest'
import {
  getContentSourceFormChangedFields,
  getContentSourceFormInitialValues,
  hasContentSourceFormChanges,
  toCreateContentSourceRequest,
  toUpdateContentSourceRequest,
} from './content-source-form'
import {
  createContentSourceFormSchema,
  editContentSourceFormSchema,
} from './content-source-form-schema'

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
  it('requires platform, display name and URL for a source create form', () => {
    expect(
      createContentSourceFormSchema
        .safeParse({
          channelId: '',
          displayName: '',
          externalId: '',
          handle: '',
          platform: null,
          url: '',
        })
        .error?.issues.map((issue) => issue.message),
    ).toEqual(
      expect.arrayContaining([
        'Выберите платформу',
        'Введите название',
        'Введите ссылку',
      ]),
    )
  })

  it('rejects unsafe source URLs with the exact validation message', () => {
    expect(
      createContentSourceFormSchema.safeParse({
        channelId: '',
        displayName: 'Unsafe',
        externalId: '',
        handle: '',
        platform: 'telegram',
        url: 'javascript://example.com/alert',
      }).error?.issues[0]?.message,
    ).toBe('Введите ссылку с протоколом http или https')
  })

  it('keeps separate edit source form schema', () => {
    expect(
      editContentSourceFormSchema.safeParse({
        channelId: '',
        displayName: 'Source',
        externalId: '',
        handle: '',
        platform: 'telegram',
        url: 'https://example.com/source',
      }).success,
    ).toBe(true)
  })

  it('builds normalized create payload with trimmed optional fields', () => {
    const request = toCreateContentSourceRequest({
      channelId: ' -100123 ',
      displayName: ' Amazing EKB Telegram ',
      externalId: '',
      handle: ' amazing_ekb ',
      platform: 'telegram',
      url: ' https://t.me/amazing_ekb ',
    })

    expect(request).toEqual({
      channelId: '-100123',
      displayName: 'Amazing EKB Telegram',
      handle: 'amazing_ekb',
      platform: 'telegram',
      url: 'https://t.me/amazing_ekb',
    })
    expect(CreateContentSourceBody.parse(request)).toEqual(request)
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
    const request = toUpdateContentSourceRequest(
      {
        ...initialValues,
        channelId: '',
        displayName: ' Amazing EKB ',
        externalId: '',
        handle: 'new_handle',
      },
      initialValues,
    )

    expect(request).toEqual({
      channelId: null,
      displayName: 'Amazing EKB',
      externalId: null,
      handle: 'new_handle',
    })
    expect(UpdateContentSourceBody.parse(request)).toEqual(request)
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
        channelId: '',
        displayName: 'Unsafe',
        externalId: '',
        handle: '',
        platform: 'telegram',
        url: 'javascript://example.com/%0Aalert(1)',
      }),
    ).toThrow('http или https')
  })
})
