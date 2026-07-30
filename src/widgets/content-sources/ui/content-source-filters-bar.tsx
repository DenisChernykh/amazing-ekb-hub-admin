import {
  getContentSourcePlatformOptions,
  getContentSourceStatusOptions,
} from '@/entities/content-source/ui/content-source-meta'
import type {
  ContentSourceResponseDtoPlatform,
  ContentSourceResponseDtoStatus,
} from '@/shared/api'
import { Flex, Select } from 'antd'
import type { ContentSourceFiltersState } from '../model/content-source-filters'
import styles from './content-sources-screen.module.css'

const allValue = 'all'

/**
 * Props URL-driven фильтров content sources.
 */
export type ContentSourceFiltersBarProps = {
  filters: ContentSourceFiltersState
  onChange: (filters: ContentSourceFiltersState) => void
}

/**
 * Рендерит фильтры content sources table поверх URL-состояния.
 */
export function ContentSourceFiltersBar({
  filters,
  onChange,
}: ContentSourceFiltersBarProps) {
  return (
    <Flex className={styles.filters} gap={12} wrap>
      <Select<ContentSourceResponseDtoPlatform | typeof allValue>
        className={styles.filter}
        onChange={(value) => {
          onChange({
            ...filters,
            platform: value === allValue ? null : value,
          })
        }}
        options={[
          { label: 'Все платформы', value: allValue },
          ...getContentSourcePlatformOptions(),
        ]}
        value={filters.platform ?? allValue}
      />
      <Select<ContentSourceResponseDtoStatus | typeof allValue>
        className={styles.filter}
        onChange={(value) => {
          onChange({
            ...filters,
            status: value === allValue ? null : value,
          })
        }}
        options={[
          { label: 'Все статусы', value: allValue },
          ...getContentSourceStatusOptions(),
        ]}
        value={filters.status ?? allValue}
      />
    </Flex>
  )
}
