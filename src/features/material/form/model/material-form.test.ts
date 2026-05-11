import type { Material } from '@/shared/api/generated/model'
import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  getMaterialFormChangedFields,
  getMaterialFormInitialValues,
  hasMaterialFormChanges,
  toCreateMaterialRequest,
  toUpdateMaterialRequest,
  type MaterialFormValues,
} from './material-form'

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

  it('normalizes create payload and keeps selected local datetime', () => {
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
    expect(request.publishedAt).toMatch(/^2026-03-20T00:30:00[+-]\d{2}:\d{2}$/)
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
    const initialValues = getMaterialFormInitialValues(material)
    const values: MaterialFormValues = {
      ...initialValues,
      durationSec: null,
      title: '  Обновленный обзор  ',
      url: ' https://t.me/amazing_ekb/999 ',
    }

    expect(toUpdateMaterialRequest(values, initialValues)).toEqual({
      durationSec: null,
      title: 'Обновленный обзор',
      url: 'https://t.me/amazing_ekb/999',
    })
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
    const initialValues = getMaterialFormInitialValues(material)
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
