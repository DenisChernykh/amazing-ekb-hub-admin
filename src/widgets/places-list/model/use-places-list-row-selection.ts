import { useAppDispatch, useAppSelector } from '@/app/store-hooks'
import {
  bulkModerationActions,
  selectBulkModerationIsRunning,
  selectBulkModerationSelectedIds,
} from '@/features/place/bulk-moderation/model/bulk-moderation-slice'
import type { AdminPlaceSummaryResponseDto } from '@/shared/api'
import type { TableProps } from 'antd'

/**
 * Params для row selection списка мест.
 */
export type UsePlacesListRowSelectionParams = {
  visiblePlaces: AdminPlaceSummaryResponseDto[]
}

/**
 * Собирает Ant Design rowSelection для списка мест из bulk moderation store.
 */
export function usePlacesListRowSelection({
  visiblePlaces,
}: UsePlacesListRowSelectionParams): TableProps<AdminPlaceSummaryResponseDto>['rowSelection'] {
  const dispatch = useAppDispatch()
  const selectedPlaceIds = useAppSelector(selectBulkModerationSelectedIds)
  const isBulkModerationRunning = useAppSelector(selectBulkModerationIsRunning)

  return {
    getCheckboxProps: () => ({
      disabled: isBulkModerationRunning,
    }),
    onSelect: (place, selected) => {
      dispatch(
        selected
          ? bulkModerationActions.selectPlace(place)
          : bulkModerationActions.deselectPlace(place.id),
      )
    },
    onSelectAll: (selected) => {
      dispatch(
        bulkModerationActions.setVisiblePlacesSelection({
          places: visiblePlaces,
          selectedIds: selected ? visiblePlaces.map((place) => place.id) : [],
        }),
      )
    },
    preserveSelectedRowKeys: true,
    selectedRowKeys: selectedPlaceIds,
  }
}
