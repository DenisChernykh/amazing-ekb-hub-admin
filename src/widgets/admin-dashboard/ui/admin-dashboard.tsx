import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import { UnorderedListOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Space, Typography } from 'antd'

/**
 * Продуктовый dashboard widget с приветствием и быстрым переходом к местам.
 */
export function AdminDashboard() {
  return (
    <>
      <DocumentTitle title="Обзор" />
      <Flex gap={16} vertical>
        <Typography.Title level={2}>Обзор</Typography.Title>

        <Card>
          <Flex gap={24} vertical>
            <Space orientation="vertical" size={8}>
              <Typography.Title level={3}>
                Добро пожаловать в панель управления гидом
              </Typography.Title>
              <Typography.Paragraph type="secondary">
                Управляйте местами, карточками и материалами Amazing EKB Hub из
                одного защищенного интерфейса.
              </Typography.Paragraph>
            </Space>

            <Button
              href="/places"
              icon={<UnorderedListOutlined aria-hidden="true" />}
              type="primary"
            >
              Перейти к местам
            </Button>
          </Flex>
        </Card>
      </Flex>
    </>
  )
}
