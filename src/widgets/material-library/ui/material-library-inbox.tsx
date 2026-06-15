import { useMaterialLibraryQuery } from '@/entities/material/model/material-library-hooks'
import {
  formatMaterialMediaKind,
  formatMaterialPublishedDate,
  getMaterialAdminStatusMeta,
  getMaterialAdminStatusOptions,
  getMaterialLinkedMeta,
  getMaterialPlatformMeta,
  getMaterialPlatformOptions,
} from '@/entities/material/ui/material-meta'
import { MaterialAdminStatusActions } from '@/features/material/admin-status/ui/material-admin-status-actions'
import type {
  AdminMaterialLibraryItem,
  MaterialAdminStatus,
  Platform,
} from '@/shared/api/generated/model'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import {
  ScreenApiErrorState,
  ScreenEmptyState,
  ScreenLoadingState,
} from '@/shared/ui/screen-state/screen-state'
import { Card, Flex, Select, Table, Tag, Typography, theme } from 'antd'
import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router'
import {
  buildMaterialLibraryFiltersSearch,
  getMaterialLibraryFiltersFromSearch,
  getMaterialLibraryQueryParams,
  type MaterialLibraryFiltersState,
} from '../model/material-library-filters'
import styles from './material-library-inbox.module.css'

const allValue = 'all'

const linkedFilterOptions = [
  { label: 'Все связи', value: allValue },
  { label: 'Связанные', value: 'true' },
  { label: 'Без связи', value: 'false' },
]

const emptyMaterialLibraryResponse = {
  items: [],
}

type MaterialLibraryInboxVariables = CSSProperties & {
  '--material-library-border': string
}

const getPreviewText = (material: AdminMaterialLibraryItem) => {
  return material.excerpt ?? material.title ?? material.text ?? '—'
}

const getSourceTitle = (material: AdminMaterialLibraryItem) => {
  return material.source?.displayName ?? 'Ручной материал'
}

const hasActiveFilters = (filters: MaterialLibraryFiltersState) => {
  return (
    filters.platform !== null ||
    filters.adminStatus !== null ||
    filters.linked !== null
  )
}

/**
 * Виджет inbox общей библиотеки материалов с URL-driven фильтрами и review actions.
 */
export function MaterialLibraryInbox() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { token } = theme.useToken()
  const filters = getMaterialLibraryFiltersFromSearch(searchParams)
  const materialLibraryQuery = useMaterialLibraryQuery(
    getMaterialLibraryQueryParams(filters),
  )
  const data = materialLibraryQuery.data ?? emptyMaterialLibraryResponse
  const style: MaterialLibraryInboxVariables = {
    '--material-library-border': token.colorBorderSecondary,
  }

  const updateFilters = (nextFilters: MaterialLibraryFiltersState) => {
    setSearchParams(
      buildMaterialLibraryFiltersSearch(searchParams, nextFilters),
    )
  }

  const resetFilters = () => {
    updateFilters({
      adminStatus: null,
      linked: null,
      platform: null,
    })
  }

  if (materialLibraryQuery.isPending) {
    return (
      <Flex gap={16} style={style} vertical>
        <DocumentTitle title="Материалы" />
        <Typography.Title className={styles.title} level={2}>
          Материалы
        </Typography.Title>
        <ScreenLoadingState title="Загружаем материалы" />
      </Flex>
    )
  }

  if (materialLibraryQuery.isError) {
    return (
      <Flex gap={16} style={style} vertical>
        <DocumentTitle title="Материалы" />
        <Typography.Title className={styles.title} level={2}>
          Материалы
        </Typography.Title>
        <ScreenApiErrorState
          error={materialLibraryQuery.error}
          forbiddenAction={{ label: 'На главную', to: '/' }}
          notFoundAction={{ label: 'К материалам', to: '/materials' }}
        />
      </Flex>
    )
  }

  const columns = [
    {
      dataIndex: 'source',
      key: 'source',
      render: (
        _value: AdminMaterialLibraryItem['source'],
        material: AdminMaterialLibraryItem,
      ) => {
        const platformMeta = getMaterialPlatformMeta(material.platform)

        return (
          <Flex className={styles.sourceCell} gap={4} vertical>
            <Typography.Text strong>{getSourceTitle(material)}</Typography.Text>
            <Tag color={platformMeta.color}>{platformMeta.label}</Tag>
          </Flex>
        )
      },
      title: 'Источник',
    },
    {
      dataIndex: 'externalId',
      key: 'externalId',
      render: (externalId: AdminMaterialLibraryItem['externalId']) =>
        externalId ?? '—',
      title: 'External ID',
    },
    {
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      render: (publishedAt: string) => formatMaterialPublishedDate(publishedAt),
      title: 'Дата',
    },
    {
      key: 'preview',
      render: (_value: unknown, material: AdminMaterialLibraryItem) => (
        <Typography.Paragraph
          className={styles.previewText}
          ellipsis={{ rows: 2 }}
        >
          {getPreviewText(material)}
        </Typography.Paragraph>
      ),
      title: 'Текст',
    },
    {
      dataIndex: 'mediaKind',
      key: 'mediaKind',
      render: (mediaKind: AdminMaterialLibraryItem['mediaKind']) =>
        formatMaterialMediaKind(mediaKind),
      title: 'Медиа',
    },
    {
      dataIndex: 'linked',
      key: 'linked',
      render: (linked: AdminMaterialLibraryItem['linked']) => {
        const meta = getMaterialLinkedMeta(linked)

        return <Tag color={meta.color}>{meta.label}</Tag>
      },
      title: 'Связь',
    },
    {
      dataIndex: 'adminStatus',
      key: 'adminStatus',
      render: (status: AdminMaterialLibraryItem['adminStatus']) => {
        const meta = getMaterialAdminStatusMeta(status)

        return <Tag color={meta.color}>{meta.label}</Tag>
      },
      title: 'Статус',
    },
    {
      key: 'actions',
      render: (_value: unknown, material: AdminMaterialLibraryItem) => (
        <MaterialAdminStatusActions material={material} />
      ),
      title: 'Действия',
    },
  ]

  const emptyText = (
    <ScreenEmptyState
      description={
        hasActiveFilters(filters)
          ? 'По выбранным фильтрам материалов не найдено'
          : 'Материалов пока нет'
      }
      primaryAction={
        hasActiveFilters(filters)
          ? { label: 'Сбросить фильтры', onClick: resetFilters }
          : undefined
      }
    />
  )

  return (
    <Flex gap={16} style={style} vertical>
      <DocumentTitle title="Материалы" />
      <Flex align="center" justify="space-between" wrap>
        <Typography.Title className={styles.title} level={2}>
          Материалы
        </Typography.Title>
        <Typography.Text type="secondary">
          Всего: {data.items.length}
        </Typography.Text>
      </Flex>

      <Card className={styles.card}>
        <Flex className={styles.filters} gap={12} wrap>
          <Select
            className={styles.filter}
            onChange={(value) => {
              updateFilters({
                ...filters,
                platform: value === allValue ? null : (value as Platform),
              })
            }}
            options={[
              { label: 'Все платформы', value: allValue },
              ...getMaterialPlatformOptions(),
            ]}
            value={filters.platform ?? allValue}
          />
          <Select
            className={styles.filter}
            onChange={(value) => {
              updateFilters({
                ...filters,
                adminStatus:
                  value === allValue ? null : (value as MaterialAdminStatus),
              })
            }}
            options={[
              { label: 'Все статусы', value: allValue },
              ...getMaterialAdminStatusOptions(),
            ]}
            value={filters.adminStatus ?? allValue}
          />
          <Select
            className={styles.filter}
            onChange={(value) => {
              updateFilters({
                ...filters,
                linked:
                  value === allValue ? null : (value as string) === 'true',
              })
            }}
            options={linkedFilterOptions}
            value={filters.linked === null ? allValue : String(filters.linked)}
          />
        </Flex>

        <div className={styles.tableWrap}>
          <Table
            columns={columns}
            dataSource={data.items}
            loading={materialLibraryQuery.isFetching}
            locale={{ emptyText }}
            pagination={false}
            rowKey="id"
          />
        </div>
      </Card>
    </Flex>
  )
}
