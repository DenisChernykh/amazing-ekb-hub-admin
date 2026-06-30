import type { ContentSource, ImportRun } from '@/shared/api/generated/model'
import { ScreenEmptyState } from '@/shared/ui/screen-state/screen-state'
import { Table } from 'antd'
import type { ContentSourceFiltersState } from '../model/content-source-filters'
import styles from './content-sources-screen.module.css'
import { getContentSourcesTableColumns } from './content-sources-table-columns'

/**
 * Props таблицы content sources.
 */
export type ContentSourcesTableProps = {
  contentSources: ContentSource[]
  filters: ContentSourceFiltersState
  importRuns: ImportRun[]
  isFetching: boolean
  onEdit: (contentSource: ContentSource) => void
  onResetFilters: () => void
}

const hasActiveFilters = (filters: ContentSourceFiltersState) => {
  return filters.platform !== null || filters.status !== null
}

/**
 * Рендерит content sources с идентификаторами, статусом и action-кнопками.
 *
 * @remarks Передает active `ImportRun` в Telegram import action, чтобы кнопка
 * блокировалась от durable backend state после refresh.
 */
export function ContentSourcesTable({
  contentSources,
  filters,
  importRuns,
  isFetching,
  onEdit,
  onResetFilters,
}: ContentSourcesTableProps) {
  const emptyText = (
    <ScreenEmptyState
      description={
        hasActiveFilters(filters)
          ? 'По выбранным фильтрам источников не найдено'
          : 'Источников пока нет'
      }
      primaryAction={
        hasActiveFilters(filters)
          ? { label: 'Сбросить фильтры', onClick: onResetFilters }
          : undefined
      }
    />
  )

  return (
    <div className={styles.tableWrap}>
      <Table
        columns={getContentSourcesTableColumns({ importRuns, onEdit })}
        dataSource={contentSources}
        loading={isFetching}
        locale={{ emptyText }}
        pagination={false}
        rowKey="id"
      />
    </div>
  )
}
