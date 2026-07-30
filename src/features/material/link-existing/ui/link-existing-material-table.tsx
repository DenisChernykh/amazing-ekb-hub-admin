import {
  MaterialLibraryAdminStatusTag,
  MaterialLibraryLinkedTag,
  MaterialLibraryMediaCell,
  MaterialLibraryPreviewCell,
  MaterialLibrarySourceCell,
} from '@/entities/material/ui/material-library-cells'
import { formatMaterialPublishedDate } from '@/entities/material/ui/material-meta'
import type { AdminMaterialLibraryResponseDto } from '@/shared/api'
import type { TableColumnsType } from 'antd'
import { Button, Table } from 'antd'

/**
 * Рендерит таблицу approved library materials для сценария привязки к месту.
 */
export function LinkExistingMaterialTable({
  isFetching,
  isLinkPending,
  materials,
  onLink,
}: {
  isFetching: boolean
  isLinkPending: boolean
  materials: AdminMaterialLibraryResponseDto[]
  onLink: (material: AdminMaterialLibraryResponseDto) => void
}) {
  const columns: TableColumnsType<AdminMaterialLibraryResponseDto> = [
    {
      dataIndex: 'source',
      key: 'source',
      render: (
        _value: AdminMaterialLibraryResponseDto['source'],
        material: AdminMaterialLibraryResponseDto,
      ) => <MaterialLibrarySourceCell material={material} />,
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
        <MaterialLibraryPreviewCell linkMode="text" material={material} />
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
      dataIndex: 'adminStatus',
      key: 'adminStatus',
      render: (status: AdminMaterialLibraryResponseDto['adminStatus']) => (
        <MaterialLibraryAdminStatusTag status={status} />
      ),
      title: 'Статус',
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
      key: 'actions',
      render: (_value: unknown, material: AdminMaterialLibraryResponseDto) => (
        <Button
          aria-label="Связать"
          disabled={isLinkPending}
          loading={isLinkPending}
          onClick={() => {
            onLink(material)
          }}
          size="small"
          type="primary"
        >
          Связать
        </Button>
      ),
      title: 'Действия',
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={materials}
      loading={isFetching}
      pagination={false}
      rowKey="id"
    />
  )
}
