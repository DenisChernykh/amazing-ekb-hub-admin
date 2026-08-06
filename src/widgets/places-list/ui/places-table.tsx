import type {
  AdminCollectionSummaryResponseDto,
  AdminPlaceListResponseDto,
} from '@/shared/api'
import { Table, type TableProps } from 'antd'
import type { ReactNode } from 'react'
import { getPlacesTableColumns } from './places-table-columns'

type PlacesTableProps = {
  data: AdminPlaceListResponseDto
  emptyText?: ReactNode
  loading: boolean
  rowSelection?: TableProps<
    AdminPlaceListResponseDto['items'][number]
  >['rowSelection']
  collections?: AdminCollectionSummaryResponseDto[]
}

/**
 * Таблица мест без собственного server-state и URL-state.
 */
export function PlacesTable({
  data,
  emptyText = 'Места не найдены',
  loading,
  rowSelection,
  collections = [],
}: PlacesTableProps) {
  return (
    <Table
      columns={getPlacesTableColumns(collections)}
      dataSource={data.items}
      loading={loading}
      locale={{ emptyText }}
      pagination={false}
      rowKey="id"
      rowSelection={rowSelection}
      scroll={{ x: 820 }}
      size="middle"
    />
  )
}
