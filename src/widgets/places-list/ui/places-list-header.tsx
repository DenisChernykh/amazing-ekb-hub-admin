import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Typography } from 'antd'
import { Link } from 'react-router'
import styles from './places-list.module.css'

/**
 * Props header-а списка мест.
 */
export type PlacesListHeaderProps = {
  total: number
}

/**
 * Рендерит заголовок списка мест, счетчик и переход к созданию места.
 */
export function PlacesListHeader({ total }: PlacesListHeaderProps) {
  return (
    <Flex align="center" justify="space-between" wrap>
      <Typography.Title className={styles.title} level={2}>
        Места
      </Typography.Title>

      <Flex align="center" gap={12} wrap>
        <Typography.Text type="secondary">Всего: {total}</Typography.Text>
        <Link aria-label="Создать место" to="/places/new">
          <Button icon={<PlusOutlined />} type="primary">
            Создать место
          </Button>
        </Link>
      </Flex>
    </Flex>
  )
}
