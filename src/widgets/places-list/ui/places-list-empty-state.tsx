import { ScreenEmptyState } from '@/shared/ui/screen-state/screen-state'

/**
 * Props empty state списка мест.
 */
export type PlacesListEmptyStateProps = {
  hasActiveFilters: boolean
  onResetFilters: () => void
}

/**
 * Рендерит empty state списка мест с учетом активных фильтров.
 */
export function PlacesListEmptyState({
  hasActiveFilters,
  onResetFilters,
}: PlacesListEmptyStateProps) {
  if (hasActiveFilters) {
    return (
      <ScreenEmptyState
        description="По выбранному статусу мест не найдено"
        secondaryAction={{
          label: 'Сбросить фильтр',
          onClick: onResetFilters,
        }}
      />
    )
  }

  return (
    <ScreenEmptyState
      description="Места пока не созданы"
      primaryAction={{ label: 'Создать место', to: '/places/new' }}
    />
  )
}
