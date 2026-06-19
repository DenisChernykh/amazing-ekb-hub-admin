import {
  formatContentSourceDateTime,
  getContentSourcePlatformMeta,
  getContentSourceStatusMeta,
} from '@/entities/content-source/ui/content-source-meta'
import { ImportTelegramSourceButton } from '@/features/content-source/import/ui/import-telegram-source-button'
import { ContentSourceStatusActions } from '@/features/content-source/status/ui/content-source-status-actions'
import type { ContentSource } from '@/shared/api/generated/model'
import { isSafeHttpUrl } from '@/shared/lib/url/safe-url'
import { ScreenEmptyState } from '@/shared/ui/screen-state/screen-state'
import { EditOutlined } from '@ant-design/icons'
import { Button, Flex, Table, Tag, Typography } from 'antd'
import type { ContentSourceFiltersState } from '../model/content-source-filters'
import styles from './content-sources-screen.module.css'

/**
 * Props for the content sources table.
 */
export type ContentSourcesTableProps = {
  contentSources: ContentSource[]
  filters: ContentSourceFiltersState
  isFetching: boolean
  onEdit: (contentSource: ContentSource) => void
  onResetFilters: () => void
}

const hasActiveFilters = (filters: ContentSourceFiltersState) => {
  return filters.platform !== null || filters.status !== null
}

const getSourceIdentityItems = (contentSource: ContentSource) => {
  return [
    contentSource.externalId && `external: ${contentSource.externalId}`,
    contentSource.handle && `handle: ${contentSource.handle}`,
    contentSource.channelId && `channel: ${contentSource.channelId}`,
  ].filter(Boolean)
}

/**
 * Renders content sources with identity, status, edit, enable/disable and import actions.
 */
export function ContentSourcesTable({
  contentSources,
  filters,
  isFetching,
  onEdit,
  onResetFilters,
}: ContentSourcesTableProps) {
  const columns = [
    {
      dataIndex: 'displayName',
      key: 'displayName',
      render: (
        displayName: ContentSource['displayName'],
        contentSource: ContentSource,
      ) => {
        const platformMeta = getContentSourcePlatformMeta(
          contentSource.platform,
        )
        const safeHref = isSafeHttpUrl(contentSource.url)
          ? contentSource.url
          : null

        return (
          <Flex className={styles.sourceCell} gap={4} vertical>
            {safeHref ? (
              <Typography.Link
                href={safeHref}
                rel="noopener noreferrer"
                strong
                target="_blank"
              >
                {displayName}
              </Typography.Link>
            ) : (
              <Typography.Text strong>{displayName}</Typography.Text>
            )}
            <Tag color={platformMeta.color}>{platformMeta.label}</Tag>
          </Flex>
        )
      },
      title: 'Источник',
    },
    {
      key: 'identity',
      render: (_value: unknown, contentSource: ContentSource) => {
        const identityItems = getSourceIdentityItems(contentSource)

        return (
          <Flex className={styles.identityCell} gap={2} vertical>
            {identityItems.length ? (
              identityItems.map((item) => (
                <Typography.Text key={item} type="secondary">
                  {item}
                </Typography.Text>
              ))
            ) : (
              <Typography.Text type="secondary">—</Typography.Text>
            )}
          </Flex>
        )
      },
      title: 'Идентификаторы',
    },
    {
      dataIndex: 'lastImportedAt',
      key: 'lastImportedAt',
      render: (value: ContentSource['lastImportedAt']) =>
        formatContentSourceDateTime(value),
      title: 'Последний импорт',
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: ContentSource['status']) => {
        const meta = getContentSourceStatusMeta(status)

        return <Tag color={meta.color}>{meta.label}</Tag>
      },
      title: 'Статус',
    },
    {
      key: 'actions',
      render: (_value: unknown, contentSource: ContentSource) => (
        <Flex gap={8} vertical>
          <Button
            icon={<EditOutlined aria-hidden="true" />}
            onClick={() => {
              onEdit(contentSource)
            }}
            size="small"
          >
            Редактировать
          </Button>
          <ContentSourceStatusActions contentSource={contentSource} />
          <ImportTelegramSourceButton contentSource={contentSource} />
        </Flex>
      ),
      title: 'Действия',
    },
  ]
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
        columns={columns}
        dataSource={contentSources}
        loading={isFetching}
        locale={{ emptyText }}
        pagination={false}
        rowKey="id"
      />
    </div>
  )
}
