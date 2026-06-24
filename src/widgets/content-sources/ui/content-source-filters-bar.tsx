import {
  getContentSourcePlatformOptions,
  getContentSourceStatusOptions,
} from '@/entities/content-source/ui/content-source-meta'
import type {
  ContentSourcePlatform,
  ContentSourceStatus,
} from '@/shared/api/generated/model'
import { Flex, Select } from 'antd'
import type { ContentSourceFiltersState } from '../model/content-source-filters'
import styles from './content-sources-screen.module.css'

const allValue = 'all'

/**
 * Props for the content source filter controls.
 */
export type ContentSourceFiltersBarProps = {
  filters: ContentSourceFiltersState
  onChange: (filters: ContentSourceFiltersState) => void
}

/**
 * Renders URL-backed filters for the content sources table.
 */
export function ContentSourceFiltersBar({
  filters,
  onChange,
}: ContentSourceFiltersBarProps) {
  return (
    <Flex className={styles.filters} gap={12} wrap>
      <Select
        className={styles.filter}
        onChange={(value) => {
          onChange({
            ...filters,
            platform:
              value === allValue ? null : (value as ContentSourcePlatform),
          })
        }}
        options={[
          { label: 'Все платформы', value: allValue },
          ...getContentSourcePlatformOptions(),
        ]}
        value={filters.platform ?? allValue}
      />
      <Select
        className={styles.filter}
        onChange={(value) => {
          onChange({
            ...filters,
            status: value === allValue ? null : (value as ContentSourceStatus),
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
