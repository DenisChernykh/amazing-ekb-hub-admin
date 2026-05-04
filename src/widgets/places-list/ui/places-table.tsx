import type { PlaceListResponse } from '@/shared/api/generated/model'
import { Table } from 'antd'
import { placesTableColumns } from './places-table-columns'

type PlacesTableProps = {
  data: PlaceListResponse
  loading: boolean
}

/**
 * Read-only таблица мест без собственного server-state и URL-state.
 */
export function PlacesTable({ data, loading }: PlacesTableProps) {
  return (
    <Table
      columns={placesTableColumns}
      dataSource={data.items}
      loading={loading}
      locale={{ emptyText: 'Места не найдены' }}
      pagination={false}
      rowKey="id"
      scroll={{ x: 820 }}
      size="middle"
    />
  )
}
