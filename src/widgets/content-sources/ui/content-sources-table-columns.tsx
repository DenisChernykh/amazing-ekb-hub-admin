import {
  formatContentSourceDateTime,
  getContentSourcePlatformMeta,
  getContentSourceStatusMeta,
} from '@/entities/content-source/ui/content-source-meta'
import { getActiveImportRunForSource } from '@/entities/import-run/model/import-run-cache'
import { ImportTelegramSourceButton } from '@/features/content-source/import/ui/import-telegram-source-button'
import { ContentSourceStatusActions } from '@/features/content-source/status/ui/content-source-status-actions'
import type {
  ContentSourceResponseDto,
  ImportRunResponseDto,
} from '@/shared/api'
import { isSafeHttpUrl } from '@/shared/lib/url/safe-url'
import { EditOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import { Button, Flex, Tag, Typography } from 'antd'
import styles from './content-sources-screen.module.css'

const getSourceIdentityItems = (contentSource: ContentSourceResponseDto) => {
  return [
    contentSource.externalId && `external: ${contentSource.externalId}`,
    contentSource.handle && `handle: ${contentSource.handle}`,
    contentSource.channelId && `channel: ${contentSource.channelId}`,
  ].filter(Boolean)
}

/**
 * Создает колонки таблицы content sources с action-кнопками строк.
 */
export function getContentSourcesTableColumns({
  importRuns,
  onEdit,
}: {
  importRuns: ImportRunResponseDto[]
  onEdit: (contentSource: ContentSourceResponseDto) => void
}): TableColumnsType<ContentSourceResponseDto> {
  return [
    {
      dataIndex: 'displayName',
      key: 'displayName',
      render: (
        displayName: ContentSourceResponseDto['displayName'],
        contentSource: ContentSourceResponseDto,
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
      render: (_value: unknown, contentSource: ContentSourceResponseDto) => {
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
      render: (value: ContentSourceResponseDto['lastImportedAt']) =>
        formatContentSourceDateTime(value),
      title: 'Последний импорт',
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: ContentSourceResponseDto['status']) => {
        const meta = getContentSourceStatusMeta(status)

        return <Tag color={meta.color}>{meta.label}</Tag>
      },
      title: 'Статус',
    },
    {
      key: 'actions',
      render: (_value: unknown, contentSource: ContentSourceResponseDto) => (
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
          <ImportTelegramSourceButton
            activeImportRun={getActiveImportRunForSource(
              importRuns,
              contentSource.id,
            )}
            contentSource={contentSource}
          />
        </Flex>
      ),
      title: 'Действия',
    },
  ]
}
