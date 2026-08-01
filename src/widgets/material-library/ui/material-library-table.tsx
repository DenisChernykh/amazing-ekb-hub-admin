import {
  MaterialLibraryAdminStatusTag,
  MaterialLibraryLinkedTag,
  MaterialLibraryMediaCell,
  MaterialLibraryPreviewCell,
  MaterialLibrarySourceCell,
} from '@/entities/material/ui/material-library-cells'
import { formatMaterialPublishedDate } from '@/entities/material/ui/material-meta'
import { MaterialAdminStatusActions } from '@/features/material/admin-status/ui/material-admin-status-actions'
import type { AdminMaterialLibraryResponseDto } from '@/shared/api'
import { Table } from 'antd'
import type { ReactNode } from 'react'
import styles from './material-library-inbox.module.css'

const columns = [
  {
    dataIndex: 'source',
    key: 'source',
    render: (
      _value: AdminMaterialLibraryResponseDto['source'],
      material: AdminMaterialLibraryResponseDto,
    ) => (
      <MaterialLibrarySourceCell
        className={styles.sourceCell}
        material={material}
      />
    ),
    title: 'Источник',
  },
  {
    dataIndex: 'publishedAt',
    key: 'publishedAt',
    render: (publishedAt: string) => formatMaterialPublishedDate(publishedAt),
    title: 'Дата',
  },
  {
    key: 'preview',
    render: (_value: unknown, material: AdminMaterialLibraryResponseDto) => (
      <MaterialLibraryPreviewCell
        className={styles.previewCell}
        linkMode="action"
        material={material}
        textClassName={styles.previewText}
      />
    ),
    title: 'Текст',
  },
  {
    dataIndex: 'mediaKind',
    key: 'mediaKind',
    render: (
      _mediaKind: AdminMaterialLibraryResponseDto['mediaKind'],
      material: AdminMaterialLibraryResponseDto,
    ) => <MaterialLibraryMediaCell material={material} />,
    title: 'Медиа',
  },
  {
    dataIndex: 'linked',
    key: 'linked',
    render: (linked: AdminMaterialLibraryResponseDto['linked']) => (
      <MaterialLibraryLinkedTag linked={linked} />
    ),
    title: 'Связь',
  },
  {
    dataIndex: 'adminStatus',
    key: 'adminStatus',
    render: (status: AdminMaterialLibraryResponseDto['adminStatus']) => (
      <MaterialLibraryAdminStatusTag status={status} />
    ),
    title: 'Статус',
  },
  {
    key: 'actions',
    render: (_value: unknown, material: AdminMaterialLibraryResponseDto) => (
      <MaterialAdminStatusActions material={material} />
    ),
    title: 'Действия',
  },
]

/**
 * Рендерит таблицу material library inbox без владения URL/query состоянием.
 */
export function MaterialLibraryTable({
  emptyText,
  isFetching,
  materials,
}: {
  emptyText: ReactNode
  isFetching: boolean
  materials: AdminMaterialLibraryResponseDto[]
}) {
  return (
    <div className={styles.tableWrap}>
      <Table
        columns={columns}
        dataSource={materials}
        loading={isFetching}
        locale={{ emptyText }}
        pagination={false}
        rowKey="id"
      />
    </div>
  )
}
