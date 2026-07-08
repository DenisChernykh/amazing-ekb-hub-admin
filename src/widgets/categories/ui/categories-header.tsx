import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Typography } from 'antd'
import styles from './categories-screen.module.css'

/**
 * Рендерит заголовок categories screen и primary action создания.
 */
export function CategoriesHeader({
  onCreate,
  total,
}: {
  onCreate: () => void
  total: number
}) {
  return (
    <Flex align="center" justify="space-between" wrap>
      <Typography.Title className={styles.title} level={2}>
        Категории
      </Typography.Title>
      <Flex align="center" gap={12} wrap>
        <Typography.Text type="secondary">Всего: {total}</Typography.Text>
        <Button
          icon={<PlusOutlined aria-hidden="true" />}
          onClick={onCreate}
          type="primary"
        >
          Создать категорию
        </Button>
      </Flex>
    </Flex>
  )
}
