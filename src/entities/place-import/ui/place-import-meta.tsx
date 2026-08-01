import type { PlaceImportOperationResponseDtoStatus } from '@/shared/api'
import { Tag } from 'antd'

const statusMeta: Record<
  PlaceImportOperationResponseDtoStatus,
  { color: string; label: string }
> = {
  awaiting_captcha: { color: 'warning', label: 'Нужна CAPTCHA' },
  cancelled: { color: 'default', label: 'Отменён' },
  completed: { color: 'success', label: 'Завершён' },
  expired: { color: 'error', label: 'Время истекло' },
  failed: { color: 'error', label: 'Ошибка' },
  parsing: { color: 'processing', label: 'Читаем карточку' },
  preview_ready: { color: 'blue', label: 'Готов к подтверждению' },
  queued: { color: 'default', label: 'В очереди' },
}

/** Показывает локализованный статус операции импорта. */
export function PlaceImportStatusTag({
  status,
}: {
  status: PlaceImportOperationResponseDtoStatus
}) {
  const meta = statusMeta[status]
  return <Tag color={meta.color}>{meta.label}</Tag>
}
