import type { AdminPlaceListResponseDto } from '@/shared/api'
import { Table, type TableProps } from 'antd'
import type { ReactNode } from 'react'
import { placesTableColumns } from './places-table-columns'

type PlacesTableProps = {
  data: AdminPlaceListResponseDto
  emptyText?: ReactNode
  loading: boolean
  rowSelection?: TableProps<
    AdminPlaceListResponseDto['items'][number]
  >['rowSelection']
}

/**
 * Таблица мест без собственного server-state и URL-state.
 */
export function PlacesTable({
  data,
  emptyText = 'Места не найдены',
  loading,
  rowSelection,
}: PlacesTableProps) {
  return (
    <Table
      columns={placesTableColumns}
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
