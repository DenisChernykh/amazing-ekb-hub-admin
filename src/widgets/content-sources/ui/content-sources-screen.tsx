import { useContentSourcesQuery } from '@/entities/content-source/model/content-source-hooks'
import { useImportRunsQuery } from '@/entities/import-run/model/import-run-hooks'
import type { ContentSourceResponseDto } from '@/shared/api'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import {
  ScreenApiErrorState,
  ScreenLoadingState,
} from '@/shared/ui/screen-state/screen-state'
import { Card, Flex, theme } from 'antd'
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
import { ContentSourcesDrawers } from './content-sources-drawers'
import { ContentSourcesHeader } from './content-sources-header'
import styles from './content-sources-screen.module.css'
import { ContentSourcesStateLayout } from './content-sources-state-layout'
import { ContentSourcesTable } from './content-sources-table'
import { ImportRunEventsSubscriptions } from './import-run-events-subscriptions'
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
 *
 * @remarks Активные import runs подписываются на SSE через entity hook; durable
 * `GET /admin/import-runs` остается источником истины и fallback.
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
  const [editingSource, setEditingSource] =
    useState<ContentSourceResponseDto | null>(null)
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
      <ContentSourcesStateLayout style={style}>
        <ScreenLoadingState title="Загружаем источники" />
      </ContentSourcesStateLayout>
    )
  }

  if (contentSourcesQuery.isError) {
    return (
      <ContentSourcesStateLayout style={style}>
        <ScreenApiErrorState
          error={contentSourcesQuery.error}
          forbiddenAction={{ label: 'На главную', to: '/' }}
          notFoundAction={{ label: 'К источникам', to: '/content-sources' }}
        />
      </ContentSourcesStateLayout>
    )
  }

  return (
    <Flex gap={16} style={style} vertical>
      <DocumentTitle title="Источники контента" />
      <ContentSourcesHeader
        onCreate={() => {
          setIsCreateOpen(true)
        }}
        total={contentSourceData.items.length}
      />

      <Card className={styles.card}>
        <ContentSourceFiltersBar filters={filters} onChange={updateFilters} />
        <ImportRunEventsSubscriptions importRuns={importRunData.items} />
        <ContentSourcesTable
          contentSources={contentSourceData.items}
          filters={filters}
          importRuns={importRunData.items}
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

      <ContentSourcesDrawers
        editingSource={editingSource}
        isCreateOpen={isCreateOpen}
        onCloseCreate={() => {
          setIsCreateOpen(false)
        }}
        onCloseEdit={() => {
          setEditingSource(null)
        }}
      />
    </Flex>
  )
}
