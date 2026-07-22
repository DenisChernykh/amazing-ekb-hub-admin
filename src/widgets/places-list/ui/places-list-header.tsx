import { ImportOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Typography } from 'antd'
import { Link, useNavigate } from 'react-router'
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
  const navigate = useNavigate()

  return (
    <Flex align="center" justify="space-between" wrap>
      <Typography.Title className={styles.title} level={2}>
        Места
      </Typography.Title>

      <Flex align="center" gap={12} wrap>
        <Typography.Text type="secondary">Всего: {total}</Typography.Text>
        <Button
          icon={<ImportOutlined />}
          onClick={() => navigate('/places/import/yandex')}
        >
          Импорт из Яндекс Карт
        </Button>
        <Link aria-label="Создать место" to="/places/new">
          <Button icon={<PlusOutlined />} type="primary">
            Создать место
          </Button>
        </Link>
      </Flex>
    </Flex>
  )
}
