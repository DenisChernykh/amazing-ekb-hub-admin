import { Button, Flex } from 'antd'

/**
 * Рендерит submit/clear actions для панели закрепленного материала.
 */
export function PinnedMaterialActions({
  canSubmit,
  hasPinnedMaterial,
  isClearPending,
  isMutationPending,
  isSetPending,
  onClear,
  onSubmit,
}: {
  canSubmit: boolean
  hasPinnedMaterial: boolean
  isClearPending: boolean
  isMutationPending: boolean
  isSetPending: boolean
  onClear: () => void
  onSubmit: () => void
}) {
  return (
    <Flex gap={8} justify="end" wrap>
      {hasPinnedMaterial && (
        <Button
          disabled={isMutationPending}
          loading={isClearPending}
          onClick={onClear}
        >
          Снять закрепление
        </Button>
      )}
      <Button
        disabled={!canSubmit || isMutationPending}
        loading={isSetPending}
        onClick={onSubmit}
        type="primary"
      >
        Закрепить
      </Button>
    </Flex>
  )
}
