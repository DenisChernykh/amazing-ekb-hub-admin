import { usePlacesListQuery } from '@/entities/place/model/place-hooks'
import { BulkModerationDraftRestorePrompt } from '@/features/place/bulk-moderation/ui/bulk-moderation-draft-restore-prompt'
import { BulkModerationToolbar } from '@/features/place/bulk-moderation/ui/bulk-moderation-toolbar'
import type { AdminPlaceListResponse } from '@/shared/api/generated/operation'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import {
  ScreenApiErrorState,
  ScreenLoadingState,
} from '@/shared/ui/screen-state/screen-state'
import { Card, Flex, Pagination, Segmented, theme } from 'antd'
import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router'
import {
  buildPlacesListPaginationSearch,
  buildPlacesListStatusSearch,
  getPlacesListPaginationFromSearch,
  getPlacesListStatusFromSearch,
  getPlacesListStatusFromValue,
} from '../model/pagination'
import { usePlacesListRowSelection } from '../model/use-places-list-row-selection'
import { PlacesListEmptyState } from './places-list-empty-state'
import { PlacesListHeader } from './places-list-header'
import styles from './places-list.module.css'
import { PlacesTable } from './places-table'

const emptyPlacesResponse: AdminPlaceListResponse = {
  items: [],
  page: 1,
  pageSize: 10,
  total: 0,
}

const statusFilterOptions = [
  { label: 'Все', value: 'all' },
  { label: 'Опубликованные', value: 'active' },
  { label: 'Скрытые', value: 'hidden' },
]

type PlacesListVariables = CSSProperties & {
  '--places-list-border': string
}

/**
 * Виджет списка мест с URL-driven пагинацией и локальным bulk moderation workflow.
 */
export function PlacesList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { token } = theme.useToken()
  const pagination = getPlacesListPaginationFromSearch(searchParams)
  const statusFilter = getPlacesListStatusFromSearch(searchParams)
  const placesQuery = usePlacesListQuery({
    ...pagination,
    ...(statusFilter ? { status: statusFilter } : {}),
  })
  const data = placesQuery.data ?? emptyPlacesResponse
  const style: PlacesListVariables = {
    '--places-list-border': token.colorBorderSecondary,
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setSearchParams(
      buildPlacesListPaginationSearch(searchParams, { page, pageSize }),
    )
  }
  const handleStatusChange = (value: string | number) => {
    const status = getPlacesListStatusFromValue(value)
    setSearchParams(buildPlacesListStatusSearch(searchParams, status))
  }
  const rowSelection = usePlacesListRowSelection({
    visiblePlaces: data.items,
  })

  if (placesQuery.isPending) {
    return (
      <Flex gap={16} style={style} vertical>
        <DocumentTitle title="Места" />
        <PlacesListHeader total={data.total} />
        <ScreenLoadingState title="Загружаем места" />
      </Flex>
    )
  }

  if (placesQuery.isError) {
    return (
      <Flex gap={16} style={style} vertical>
        <DocumentTitle title="Места" />
        <PlacesListHeader total={data.total} />
        <ScreenApiErrorState
          error={placesQuery.error}
          forbiddenAction={{ label: 'На главную', to: '/' }}
          notFoundAction={{ label: 'К списку мест', to: '/places' }}
        />
      </Flex>
    )
  }

  const emptyText = (
    <PlacesListEmptyState
      hasActiveFilters={statusFilter !== null}
      onResetFilters={() => handleStatusChange('all')}
    />
  )

  return (
    <Flex gap={16} style={style} vertical>
      <DocumentTitle title="Места" />
      <PlacesListHeader total={data.total} />

      <Card className={styles.card}>
        <Flex className={styles.filters} justify="space-between" wrap>
          <Segmented
            onChange={handleStatusChange}
            options={statusFilterOptions}
            value={statusFilter ?? 'all'}
          />
        </Flex>

        <BulkModerationDraftRestorePrompt loadedPlaces={data.items} />

        <Flex className={styles.bulkToolbar}>
          <BulkModerationToolbar />
        </Flex>

        <PlacesTable
          data={data}
          emptyText={emptyText}
          loading={placesQuery.isPending}
          rowSelection={rowSelection}
        />

        <Flex className={styles.footer} justify="end">
          <Pagination
            current={pagination.page}
            onChange={handlePaginationChange}
            pageSize={pagination.pageSize}
            pageSizeOptions={[10, 20, 50]}
            showSizeChanger
            total={data.total}
          />
        </Flex>
      </Card>
    </Flex>
  )
}
