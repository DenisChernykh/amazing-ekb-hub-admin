import type { AdminCollectionSummaryResponseDto } from '@/shared/api'
import { ScreenEmptyState } from '@/shared/ui/screen-state/screen-state'
import { Table } from 'antd'
import { getCollectionsTableColumns } from './collections-table-columns'

/** Таблица подборок без собственного server-state. */
export function CollectionsTable({
  collections,
  loading,
  onEdit,
}: {
  collections: AdminCollectionSummaryResponseDto[]
  loading: boolean
  onEdit: (collection: AdminCollectionSummaryResponseDto) => void
}) {
  return (
    <Table
      columns={getCollectionsTableColumns({ onEdit })}
      dataSource={collections}
      loading={loading}
      locale={{
        emptyText: <ScreenEmptyState description="Подборок пока нет" />,
      }}
      pagination={false}
      rowKey="id"
      scroll={{ x: 980 }}
    />
  )
}
