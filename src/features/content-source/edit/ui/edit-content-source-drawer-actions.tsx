import { Button, Flex } from 'antd'

/**
 * Рендерит action bar edit content source drawer.
 */
export function EditContentSourceDrawerActions({
  isDirty,
  isPending,
  onCancel,
}: {
  isDirty: boolean
  isPending: boolean
  onCancel: () => void
}) {
  return (
    <Flex gap={8} justify="end" wrap>
      <Button disabled={isPending} onClick={onCancel}>
        Отмена
      </Button>
      <Button
        disabled={!isDirty}
        htmlType="submit"
        loading={isPending}
        type="primary"
      >
        Сохранить
      </Button>
    </Flex>
  )
}
