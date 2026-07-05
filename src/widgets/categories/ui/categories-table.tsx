import type { AdminPlaceCategory } from '@/shared/api/generated/model'
import { ScreenEmptyState } from '@/shared/ui/screen-state/screen-state'
import { Table } from 'antd'
import styles from './categories-screen.module.css'
import { getCategoriesTableColumns } from './categories-table-columns'

/**
 * Props таблицы категорий.
 */
export type CategoriesTableProps = {
  categories: AdminPlaceCategory[]
  isFetching: boolean
  onEdit: (category: AdminPlaceCategory) => void
}

/**
 * Рендерит таблицу категорий мест с цветами и действиями управления.
 */
export function CategoriesTable({
  categories,
  isFetching,
  onEdit,
}: CategoriesTableProps) {
  return (
    <div className={styles.tableWrap}>
      <Table
        columns={getCategoriesTableColumns({ onEdit })}
        dataSource={categories}
        loading={isFetching}
        locale={{
          emptyText: <ScreenEmptyState description="Категорий пока нет" />,
        }}
        pagination={false}
        rowKey="id"
      />
    </div>
  )
}
