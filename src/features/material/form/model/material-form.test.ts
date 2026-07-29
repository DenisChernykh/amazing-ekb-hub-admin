import {
  CreatePlaceMaterialBody,
  UpdateMaterialBody,
} from '@/shared/api/generated-zod/admin/admin.zod'
import type { Material } from '@/shared/api/generated/model'
import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  getMaterialFormChangedFields,
  getMaterialFormInitialValues,
  hasMaterialFormChanges,
  isMaterialDurationEnabled,
  toCreateMaterialRequest,
  toUpdateMaterialRequest,
  type MaterialFormValues,
} from './material-form'
import {
  createMaterialFormSchema,
  editMaterialWithoutUrlFormSchema,
  editMaterialWithUrlFormSchema,
} from './material-form-schema'

const material: Material = {
  durationSec: 125,
  id: 'material-1',
  placeId: 'place-1',
  platform: 'telegram',
  publishedAt: '2026-03-20T10:30:00+05:00',
  title: 'Обзор комплекса',
  type: 'post',
  url: 'https://t.me/amazing_ekb/321',
}

describe('material form helpers', () => {
  it('validates the required create material fields with exact messages', () => {
    const result = createMaterialFormSchema.safeParse({
      durationSec: null,
      platform: null,
      publishedAt: null,
      title: ' ',
      type: null,
      url: '',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining([
          'Выберите платформу',
          'Выберите тип материала',
          'Введите заголовок',
          'Выберите дату публикации',
          'Введите ссылку',
        ]),
      )
    }
  })

  it('requires a safe URL for create and edit forms with source URLs', () => {
    const values = {
      durationSec: null,
      platform: 'telegram' as const,
      publishedAt: dayjs('2026-03-20'),
      title: 'Пост',
      type: 'post' as const,
      url: 'javascript://example.com/%0Aalert(1)',
    }

    for (const schema of [
      createMaterialFormSchema,
      editMaterialWithUrlFormSchema,
    ]) {
      expect(schema.safeParse(values).error?.issues[0]?.message).toBe(
        'Введите ссылку с протоколом http или https',
      )
      expect(schema.safeParse({ ...values, url: ' ' }).success).toBe(false)
    }
  })

  it('allows non-url edit forms to retain an empty URL field', () => {
    expect(
      editMaterialWithoutUrlFormSchema.safeParse({
        durationSec: null,
        platform: 'telegram',
        publishedAt: dayjs('2026-03-20'),
        title: 'Пост',
        type: 'post',
        url: '',
      }).success,
    ).toBe(true)
  })

  it('keeps duration optional for non-video values and accepts nullable video duration', () => {
    expect(
      createMaterialFormSchema.safeParse({
        durationSec: 125,
        platform: 'telegram',
        publishedAt: dayjs('2026-03-20'),
        title: 'Пост',
        type: 'post',
        url: 'https://example.com/material/1',
      }).success,
    ).toBe(true)
    expect(
      createMaterialFormSchema.safeParse({
        durationSec: null,
        platform: 'telegram',
        publishedAt: dayjs('2026-03-20'),
        title: 'Видео',
        type: 'video',
        url: 'https://example.com/material/2',
      }).success,
    ).toBe(true)
    expect(
      createMaterialFormSchema.safeParse({
        durationSec: 125,
        platform: 'telegram',
        publishedAt: dayjs('2026-03-20'),
        title: 'Видео',
        type: 'video',
        url: 'https://example.com/material/3',
      }).success,
    ).toBe(true)
  })

  it('enables duration only for video material types', () => {
    expect(isMaterialDurationEnabled('post')).toBe(false)
    expect(isMaterialDurationEnabled('reel')).toBe(true)
    expect(isMaterialDurationEnabled('video')).toBe(true)
    expect(isMaterialDurationEnabled(undefined)).toBe(false)
  })

  it('maps material to form initial values', () => {
    const initialValues = getMaterialFormInitialValues(material)

    expect(initialValues).toMatchObject({
      durationSec: 125,
      platform: 'telegram',
      title: 'Обзор комплекса',
      type: 'post',
      url: 'https://t.me/amazing_ekb/321',
    })
    expect(initialValues.publishedAt?.format('YYYY-MM-DD')).toBe('2026-03-20')
  })

  it('keeps source publishedAt wall-clock time in edit initial values', () => {
    const initialValues = getMaterialFormInitialValues({
      ...material,
      publishedAt: '2026-03-19T22:30:00-03:00',
    })

    expect(initialValues.publishedAt?.format('YYYY-MM-DDTHH:mm')).toBe(
      '2026-03-19T22:30',
    )
  })

  it('maps nullable material title to an empty form value', () => {
    const initialValues = getMaterialFormInitialValues({
      ...material,
      title: null,
    })

    expect(initialValues.title).toBe('')
  })

  it('normalizes create payload and stores selected calendar date', () => {
    const values: MaterialFormValues = {
      durationSec: undefined,
      platform: 'telegram',
      publishedAt: dayjs('2026-03-20T00:30:00'),
      title: '  Новый обзор  ',
      type: 'video',
      url: '  https://t.me/amazing_ekb/322  ',
    }

    const request = toCreateMaterialRequest(values)

    expect(request).toMatchObject({
      durationSec: null,
      platform: 'telegram',
      title: 'Новый обзор',
      type: 'video',
      url: 'https://t.me/amazing_ekb/322',
    })
    expect(request.publishedAt).toBe('2026-03-20')
    expect(CreatePlaceMaterialBody.parse(request)).toEqual(request)
  })

  it('omits duration and stores post calendar date', () => {
    const values: MaterialFormValues = {
      durationSec: 125,
      platform: 'telegram',
      publishedAt: dayjs('2026-03-20T18:45:00'),
      title: '  Новый пост  ',
      type: 'post',
      url: 'https://t.me/amazing_ekb/322',
    }

    const request = toCreateMaterialRequest(values)

    expect(request).toMatchObject({
      platform: 'telegram',
      title: 'Новый пост',
      type: 'post',
      url: 'https://t.me/amazing_ekb/322',
    })
    expect(request).not.toHaveProperty('durationSec')
    expect(request.publishedAt).toBe('2026-03-20')
    expect(CreatePlaceMaterialBody.parse(request)).toEqual(request)
  })

  it('rejects unsafe material URLs before building create payload', () => {
    const values: MaterialFormValues = {
      durationSec: null,
      platform: 'telegram',
      publishedAt: dayjs('2026-03-20T00:30:00'),
      title: 'Новый обзор',
      type: 'post',
      url: 'javascript://example.com/%0Aalert(1)',
    }

    expect(() => toCreateMaterialRequest(values)).toThrow('http или https')
  })

  it('builds partial update payload only from changed normalized fields', () => {
    const initialValues = getMaterialFormInitialValues({
      ...material,
      type: 'video',
    })
    const values: MaterialFormValues = {
      ...initialValues,
      durationSec: null,
      title: '  Обновленный обзор  ',
      url: ' https://t.me/amazing_ekb/999 ',
    }

    const request = toUpdateMaterialRequest(values, initialValues)

    expect(request).toEqual({
      durationSec: null,
      title: 'Обновленный обзор',
      url: 'https://t.me/amazing_ekb/999',
    })
    expect(UpdateMaterialBody.parse(request)).toEqual(request)
  })

  it('clears duration when changing a video material to post', () => {
    const initialValues = getMaterialFormInitialValues({
      ...material,
      durationSec: 125,
      publishedAt: '2026-03-20T10:30:00+05:00',
      type: 'video',
    })
    const values: MaterialFormValues = {
      ...initialValues,
      type: 'post',
    }

    const request = toUpdateMaterialRequest(values, initialValues)

    expect(request).toEqual({ durationSec: null, type: 'post' })
  })

  it('does not resubmit unchanged unsafe material URL in update payload', () => {
    const initialValues = getMaterialFormInitialValues({
      ...material,
      url: 'javascript://example.com/%0Aalert(1)',
    })
    const values: MaterialFormValues = {
      ...initialValues,
      title: 'Обновленный обзор',
    }

    expect(toUpdateMaterialRequest(values, initialValues)).toEqual({
      title: 'Обновленный обзор',
    })
  })

  it('treats whitespace-only differences as unchanged', () => {
    const initialValues = getMaterialFormInitialValues(material)
    const values: MaterialFormValues = {
      ...initialValues,
      title: '  Обзор комплекса  ',
      url: '  https://t.me/amazing_ekb/321  ',
    }

    expect(hasMaterialFormChanges(values, initialValues)).toBe(false)
    expect(toUpdateMaterialRequest(values, initialValues)).toEqual({})
  })

  it('returns changed field labels for edit drawer chips', () => {
    const initialValues = getMaterialFormInitialValues({
      ...material,
      type: 'video',
    })
    const values: MaterialFormValues = {
      ...initialValues,
      durationSec: null,
      platform: 'dzen',
      title: 'Обновленный обзор',
    }

    expect(getMaterialFormChangedFields(values, initialValues)).toEqual([
      { key: 'platform', label: 'Платформа' },
      { key: 'title', label: 'Заголовок' },
      { key: 'durationSec', label: 'Длительность' },
    ])
  })
})
