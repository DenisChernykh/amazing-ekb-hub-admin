import type { ImportRunResponseDtoStatus } from '@/shared/api'

/**
 * UI-метаданные import run для тегов и таблиц.
 */
export type ImportRunMeta = {
  color: string
  label: string
}

/**
 * Счетчики import run, отображаемые в диагностической таблице.
 */
export type ImportRunCounts = {
  createdCount: number
  foundCount: number
  skippedDuplicateCount: number
  updatedCount: number
}

const importRunStatusMeta: Record<ImportRunResponseDtoStatus, ImportRunMeta> = {
  completed: {
    color: 'green',
    label: 'Готово',
  },
  failed: {
    color: 'red',
    label: 'Ошибка',
  },
  queued: {
    color: 'default',
    label: 'В очереди',
  },
  running: {
    color: 'blue',
    label: 'В работе',
  },
}

/**
 * Возвращает локализованные UI-метаданные статуса import run.
 */
export function getImportRunStatusMeta(status: ImportRunResponseDtoStatus) {
  return importRunStatusMeta[status]
}

/**
 * Форматирует счетчики import run в стабильном порядке.
 */
export function formatImportRunCounts(counts: ImportRunCounts) {
  return [
    `Найдено ${counts.foundCount}`,
    `Создано ${counts.createdCount}`,
    `Обновлено ${counts.updatedCount}`,
    `Дубликаты ${counts.skippedDuplicateCount}`,
  ].join(' · ')
}

/**
 * Форматирует nullable datetime import run без timezone-пересчета.
 *
 * @returns `—`, если значение отсутствует.
 */
export function formatImportRunDateTime(value: string | null) {
  if (value === null) {
    return '—'
  }

  return value.slice(0, 16).replace('T', ' ')
}
