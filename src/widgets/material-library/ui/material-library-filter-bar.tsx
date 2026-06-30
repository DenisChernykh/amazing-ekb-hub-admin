import {
  getMaterialAdminStatusOptions,
  getMaterialPlatformOptions,
} from '@/entities/material/ui/material-meta'
import type {
  MaterialAdminStatus,
  Platform,
} from '@/shared/api/generated/model'
import { Flex, Select } from 'antd'
import type { MaterialLibraryFiltersState } from '../model/material-library-filters'
import styles from './material-library-inbox.module.css'

const allValue = 'all'

type MaterialLibraryLinkedSelectValue = typeof allValue | 'true' | 'false'

const linkedFilterOptions: Array<{
  label: string
  value: MaterialLibraryLinkedSelectValue
}> = [
  { label: 'Все связи', value: allValue },
  { label: 'Связанные', value: 'true' },
  { label: 'Без связи', value: 'false' },
]

/**
 * Рендерит URL-driven фильтры material library inbox.
 */
export function MaterialLibraryFilterBar({
  filters,
  onChange,
}: {
  filters: MaterialLibraryFiltersState
  onChange: (filters: MaterialLibraryFiltersState) => void
}) {
  return (
    <Flex className={styles.filters} gap={12} wrap>
      <Select<Platform | typeof allValue>
        className={styles.filter}
        onChange={(value) => {
          onChange({
            ...filters,
            platform: value === allValue ? null : value,
          })
        }}
        options={[
          { label: 'Все платформы', value: allValue },
          ...getMaterialPlatformOptions(),
        ]}
        value={filters.platform ?? allValue}
      />
      <Select<MaterialAdminStatus | typeof allValue>
        className={styles.filter}
        onChange={(value) => {
          onChange({
            ...filters,
            adminStatus: value === allValue ? null : value,
          })
        }}
        options={[
          { label: 'Все статусы', value: allValue },
          ...getMaterialAdminStatusOptions(),
        ]}
        value={filters.adminStatus ?? allValue}
      />
      <Select<MaterialLibraryLinkedSelectValue>
        className={styles.filter}
        onChange={(value) => {
          onChange({
            ...filters,
            linked: value === allValue ? null : value === 'true',
          })
        }}
        options={linkedFilterOptions}
        value={
          filters.linked === null ? allValue : filters.linked ? 'true' : 'false'
        }
      />
    </Flex>
  )
}
