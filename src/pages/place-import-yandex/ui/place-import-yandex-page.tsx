import { PlaceImportYandexScreen } from '@/widgets/place-import-yandex/ui/place-import-yandex-screen'
import { useParams } from 'react-router'

/** Тонкая route page запуска или восстановления Yandex place import. */
export function PlaceImportYandexPage() {
  const { operationId } = useParams<{ operationId?: string }>()
  return <PlaceImportYandexScreen operationId={operationId} />
}
