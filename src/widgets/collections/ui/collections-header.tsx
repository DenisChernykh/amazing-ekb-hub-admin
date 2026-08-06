import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Typography } from 'antd'

/** Заголовок списка подборок с total и create action. */
export function CollectionsHeader({
  onCreate,
  total,
}: {
  onCreate: () => void
  total: number
}) {
  return (
    <Flex align="center" justify="space-between" wrap>
      <Typography.Title level={2}>Подборки</Typography.Title>
      <Flex align="center" gap={12}>
        <Typography.Text type="secondary">Всего: {total}</Typography.Text>
        <Button
          icon={<PlusOutlined aria-hidden="true" />}
          onClick={onCreate}
          type="primary"
        >
          Создать подборку
        </Button>
      </Flex>
    </Flex>
  )
}
