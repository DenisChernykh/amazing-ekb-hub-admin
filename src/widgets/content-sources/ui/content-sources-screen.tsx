import { useContentSourcesQuery } from '@/entities/content-source/model/content-source-hooks'
import { useImportRunsQuery } from '@/entities/import-run/model/import-run-hooks'
import { CreateContentSourceDrawer } from '@/features/content-source/create/ui/create-content-source-drawer'
import { EditContentSourceDrawer } from '@/features/content-source/edit/ui/edit-content-source-drawer'
import type { ContentSource } from '@/shared/api/generated/model'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import {
  ScreenApiErrorState,
  ScreenLoadingState,
} from '@/shared/ui/screen-state/screen-state'
import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Typography, theme } from 'antd'
import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  buildContentSourceFiltersSearch,
  getContentSourceFiltersFromSearch,
  getContentSourceQueryParams,
  type ContentSourceFiltersState,
} from '../model/content-source-filters'
import { ContentSourceFiltersBar } from './content-source-filters-bar'
import styles from './content-sources-screen.module.css'
import { ContentSourcesTable } from './content-sources-table'
import { ImportRunsTable } from './import-runs-table'

const emptyContentSourceResponse = {
  items: [],
}

const emptyImportRunResponse = {
  items: [],
}

const hasActiveSourceFilters = (filters: ContentSourceFiltersState) => {
  return filters.platform !== null || filters.status !== null
}

type ContentSourcesScreenVariables = CSSProperties & {
  '--content-sources-border': string
}

/**
 * Виджет управления content sources и диагностики latest import runs.
 */
export function ContentSourcesScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { token } = theme.useToken()
  const filters = getContentSourceFiltersFromSearch(searchParams)
  const hasFilters = hasActiveSourceFilters(filters)
  const contentSourcesQuery = useContentSourcesQuery(
    getContentSourceQueryParams(filters),
  )
  const sourceLookupQuery = useContentSourcesQuery(undefined, {
    enabled: hasFilters,
  })
  const importRunsQuery = useImportRunsQuery()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<ContentSource | null>(null)
  const contentSourceData =
    contentSourcesQuery.data ?? emptyContentSourceResponse
  const sourceLookupData = hasFilters
    ? (sourceLookupQuery.data ?? emptyContentSourceResponse)
    : contentSourceData
  const importRunData = importRunsQuery.data ?? emptyImportRunResponse
  const style: ContentSourcesScreenVariables = {
    '--content-sources-border': token.colorBorderSecondary,
  }

  const updateFilters = (nextFilters: ContentSourceFiltersState) => {
    setSearchParams(buildContentSourceFiltersSearch(searchParams, nextFilters))
  }

  const resetFilters = () => {
    updateFilters({
      platform: null,
      status: null,
    })
  }

  if (contentSourcesQuery.isPending) {
    return (
      <Flex gap={16} style={style} vertical>
        <DocumentTitle title="Источники контента" />
        <Typography.Title className={styles.title} level={2}>
          Источники контента
        </Typography.Title>
        <ScreenLoadingState title="Загружаем источники" />
      </Flex>
    )
  }

  if (contentSourcesQuery.isError) {
    return (
      <Flex gap={16} style={style} vertical>
        <DocumentTitle title="Источники контента" />
        <Typography.Title className={styles.title} level={2}>
          Источники контента
        </Typography.Title>
        <ScreenApiErrorState
          error={contentSourcesQuery.error}
          forbiddenAction={{ label: 'На главную', to: '/' }}
          notFoundAction={{ label: 'К источникам', to: '/content-sources' }}
        />
      </Flex>
    )
  }

  return (
    <Flex gap={16} style={style} vertical>
      <DocumentTitle title="Источники контента" />
      <Flex align="center" justify="space-between" wrap>
        <Typography.Title className={styles.title} level={2}>
          Источники контента
        </Typography.Title>
        <Flex align="center" gap={12} wrap>
          <Typography.Text type="secondary">
            Всего: {contentSourceData.items.length}
          </Typography.Text>
          <Button
            icon={<PlusOutlined aria-hidden="true" />}
            onClick={() => {
              setIsCreateOpen(true)
            }}
            type="primary"
          >
            Создать источник
          </Button>
        </Flex>
      </Flex>

      <Card className={styles.card}>
        <ContentSourceFiltersBar filters={filters} onChange={updateFilters} />
        <ContentSourcesTable
          contentSources={contentSourceData.items}
          filters={filters}
          isFetching={contentSourcesQuery.isFetching}
          onEdit={setEditingSource}
          onResetFilters={resetFilters}
        />
      </Card>

      <Card className={styles.card} title="Последние импорты">
        <ImportRunsTable
          contentSources={sourceLookupData.items}
          error={importRunsQuery.error}
          importRuns={importRunData.items}
          isError={importRunsQuery.isError}
          isFetching={
            importRunsQuery.isFetching ||
            (hasFilters && sourceLookupQuery.isFetching)
          }
          isPending={
            importRunsQuery.isPending ||
            (hasFilters && sourceLookupQuery.isPending)
          }
        />
      </Card>

      <CreateContentSourceDrawer
        onClose={() => {
          setIsCreateOpen(false)
        }}
        open={isCreateOpen}
      />
      {editingSource && (
        <EditContentSourceDrawer
          contentSource={editingSource}
          onClose={() => {
            setEditingSource(null)
          }}
          open={Boolean(editingSource)}
        />
      )}
    </Flex>
  )
}
