import { usePlacesListQuery } from '@/entities/place/model/place-hooks'
import { normalizeApiError } from '@/shared/api/client/api-error'
import type { PlaceListResponse } from '@/shared/api/generated/model'
import { PlusOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Flex,
  Pagination,
  Segmented,
  Typography,
  theme,
} from 'antd'
import type { CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  buildPlacesListPaginationSearch,
  buildPlacesListStatusSearch,
  getPlacesListPaginationFromSearch,
  getPlacesListStatusFromSearch,
  getPlacesListStatusFromValue,
} from '../model/pagination'
import styles from './places-list.module.css'
import { PlacesTable } from './places-table'

const emptyPlacesResponse: PlaceListResponse = {
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
 * Виджет read-only списка мест с URL-driven пагинацией.
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

  return (
    <Flex gap={16} style={style} vertical>
      <Flex align="center" justify="space-between" wrap>
        <Typography.Title className={styles.title} level={2}>
          Места
        </Typography.Title>

        <Flex align="center" gap={12} wrap>
          <Typography.Text type="secondary">
            Всего: {data.total}
          </Typography.Text>
          <Link aria-label="Создать место" to="/places/new">
            <Button icon={<PlusOutlined />} type="primary">
              Создать место
            </Button>
          </Link>
        </Flex>
      </Flex>

      <Card className={styles.card}>
        {placesQuery.isError ? (
          <Alert
            className={styles.error}
            title={normalizeApiError(placesQuery.error).message}
            showIcon
            type="error"
          />
        ) : (
          <>
            <Flex className={styles.filters} justify="space-between" wrap>
              <Segmented
                onChange={handleStatusChange}
                options={statusFilterOptions}
                value={statusFilter ?? 'all'}
              />
            </Flex>

            <PlacesTable data={data} loading={placesQuery.isPending} />

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
          </>
        )}
      </Card>
    </Flex>
  )
}
