import {
  formatImportRunCounts,
  formatImportRunDateTime,
  getImportRunStatusMeta,
} from '@/entities/import-run/ui/import-run-meta'
import type {
  ContentSourceResponseDto,
  ImportRunResponseDto,
} from '@/shared/api'
import type { ApiClientError } from '@/shared/api/client/api-errors'
import {
  ScreenApiErrorState,
  ScreenEmptyState,
} from '@/shared/ui/screen-state/screen-state'
import { Table, Tag, Typography } from 'antd'
import { useMemo } from 'react'
import styles from './content-sources-screen.module.css'

/**
 * Props for the latest import runs table.
 */
export type ImportRunsTableProps = {
  contentSources: ContentSourceResponseDto[]
  error: ApiClientError | null
  importRuns: ImportRunResponseDto[]
  isError: boolean
  isFetching: boolean
  isPending: boolean
}

/**
 * Renders read-only diagnostics for latest import runs.
 */
export function ImportRunsTable({
  contentSources,
  error,
  importRuns,
  isError,
  isFetching,
  isPending,
}: ImportRunsTableProps) {
  const sourceById = useMemo(() => {
    return new Map(
      contentSources.map((contentSource) => [contentSource.id, contentSource]),
    )
  }, [contentSources])
  const columns = [
    {
      dataIndex: 'sourceId',
      key: 'sourceId',
      render: (sourceId: ImportRunResponseDto['sourceId']) =>
        sourceById.get(sourceId)?.displayName ?? sourceId,
      title: 'Источник',
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: ImportRunResponseDto['status']) => {
        const meta = getImportRunStatusMeta(status)

        return <Tag color={meta.color}>{meta.label}</Tag>
      },
      title: 'Статус',
    },
    {
      key: 'counts',
      render: (_value: unknown, importRun: ImportRunResponseDto) =>
        formatImportRunCounts(importRun),
      title: 'Счетчики',
    },
    {
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (value: ImportRunResponseDto['startedAt']) =>
        formatImportRunDateTime(value),
      title: 'Начат',
    },
    {
      dataIndex: 'finishedAt',
      key: 'finishedAt',
      render: (value: ImportRunResponseDto['finishedAt']) =>
        formatImportRunDateTime(value),
      title: 'Завершен',
    },
    {
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (value: ImportRunResponseDto['errorMessage']) =>
        value ? (
          <Typography.Text className={styles.errorText} type="danger">
            {value}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
      title: 'Ошибка',
    },
  ]

  if (isError && error) {
    return (
      <ScreenApiErrorState
        error={error}
        forbiddenAction={{ label: 'На главную', to: '/' }}
        notFoundAction={{ label: 'К источникам', to: '/content-sources' }}
      />
    )
  }

  return (
    <div className={styles.tableWrap}>
      <Table
        columns={columns}
        dataSource={importRuns}
        loading={isFetching || isPending}
        locale={{
          emptyText: <ScreenEmptyState description="Импортов пока нет" />,
        }}
        pagination={false}
        rowKey="id"
      />
    </div>
  )
}
