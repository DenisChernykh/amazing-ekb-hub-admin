import { isActiveImportRunStatus } from '@/entities/import-run/model/import-run-cache'
import { useImportRunEvents } from '@/entities/import-run/model/import-run-events'
import type { ImportRunResponseDto } from '@/shared/api'

const ImportRunEventsSubscription = ({
  importRun,
}: {
  importRun: ImportRunResponseDto
}) => {
  useImportRunEvents(importRun.id, {
    sourceId: importRun.sourceId,
  })

  return null
}

/**
 * Монтирует SSE subscriptions для активных import runs без визуального UI.
 *
 * @remarks `useImportRunEvents` синхронизирует внешний EventSource с React Query cache.
 */
export function ImportRunEventsSubscriptions({
  importRuns,
}: {
  importRuns: ImportRunResponseDto[]
}) {
  return importRuns
    .filter((importRun) => isActiveImportRunStatus(importRun.status))
    .map((importRun) => (
      <ImportRunEventsSubscription importRun={importRun} key={importRun.id} />
    ))
}
