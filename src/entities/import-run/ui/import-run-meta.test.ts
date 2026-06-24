import { describe, expect, it } from 'vitest'
import {
  formatImportRunCounts,
  formatImportRunDateTime,
  getImportRunStatusMeta,
} from './import-run-meta'

describe('import run meta helpers', () => {
  it('maps import run statuses to localized tag metadata', () => {
    expect(getImportRunStatusMeta('queued')).toMatchObject({
      color: 'default',
      label: 'В очереди',
    })
    expect(getImportRunStatusMeta('failed')).toMatchObject({
      color: 'red',
      label: 'Ошибка',
    })
  })

  it('formats run counters in a stable order', () => {
    expect(
      formatImportRunCounts({
        createdCount: 2,
        foundCount: 5,
        skippedDuplicateCount: 1,
        updatedCount: 2,
      }),
    ).toBe('Найдено 5 · Создано 2 · Обновлено 2 · Дубликаты 1')
  })

  it('formats nullable import run datetimes', () => {
    expect(formatImportRunDateTime('2026-06-16T08:05:30.000Z')).toBe(
      '2026-06-16 08:05',
    )
    expect(formatImportRunDateTime(null)).toBe('—')
  })
})
