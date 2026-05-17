import type { PlaceListResponse } from '@/shared/api/generated/model'
import { Table, type TableProps } from 'antd'
import { placesTableColumns } from './places-table-columns'

type PlacesTableProps = {
  data: PlaceListResponse
  loading: boolean
  rowSelection?: TableProps<PlaceListResponse['items'][number]>['rowSelection']
}

/**
 * Таблица мест без собственного server-state и URL-state.
 */
export function PlacesTable({ data, loading, rowSelection }: PlacesTableProps) {
  return (
    <Table
      columns={placesTableColumns}
      dataSource={data.items}
      loading={loading}
      locale={{ emptyText: 'Места не найдены' }}
      pagination={false}
      rowKey="id"
      rowSelection={rowSelection}
      scroll={{ x: 820 }}
      size="middle"
    />
  )
}
