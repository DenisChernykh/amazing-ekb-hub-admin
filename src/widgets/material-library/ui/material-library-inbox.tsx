import { useMaterialLibraryQuery } from '@/entities/material/model/material-library-hooks'
import type { AdminMaterialLibraryListResponseDto } from '@/shared/api'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import {
  ScreenApiErrorState,
  ScreenEmptyState,
  ScreenLoadingState,
} from '@/shared/ui/screen-state/screen-state'
import { Card, Flex, Pagination, Typography, theme } from 'antd'
import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router'
import {
  buildMaterialLibraryFiltersSearch,
  buildMaterialLibraryPaginationSearch,
  getMaterialLibraryFiltersFromSearch,
  getMaterialLibraryPaginationFromSearch,
  getMaterialLibraryQueryParams,
  type MaterialLibraryFiltersState,
} from '../model/material-library-filters'
import { MaterialLibraryFilterBar } from './material-library-filter-bar'
import styles from './material-library-inbox.module.css'
import { MaterialLibraryTable } from './material-library-table'

const emptyMaterialLibraryResponse: AdminMaterialLibraryListResponseDto = {
  items: [],
  page: 1,
  pageSize: 20,
  total: 0,
}

type MaterialLibraryInboxVariables = CSSProperties & {
  '--material-library-border': string
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
  const pagination = getMaterialLibraryPaginationFromSearch(searchParams)
  const materialLibraryQuery = useMaterialLibraryQuery(
    getMaterialLibraryQueryParams(filters, pagination),
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

  const handlePaginationChange = (page: number, pageSize: number) => {
    setSearchParams(
      buildMaterialLibraryPaginationSearch(searchParams, { page, pageSize }),
    )
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
        <Typography.Text type="secondary">Всего: {data.total}</Typography.Text>
      </Flex>

      <Card className={styles.card}>
        <MaterialLibraryFilterBar filters={filters} onChange={updateFilters} />
        <MaterialLibraryTable
          emptyText={emptyText}
          isFetching={materialLibraryQuery.isFetching}
          materials={data.items}
        />

        <Flex className={styles.footer} justify="end">
          <Pagination
            current={pagination.page}
            onChange={handlePaginationChange}
            pageSize={pagination.pageSize}
            pageSizeOptions={[20, 50, 100]}
            showSizeChanger
            total={data.total}
          />
        </Flex>
      </Card>
    </Flex>
  )
}
