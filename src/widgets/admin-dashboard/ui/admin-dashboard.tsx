import { useCurrentUser } from '@/entities/session/model/current-user'
import { getRoleMeta } from '@/entities/session/ui/role-meta'
import { RoleTag } from '@/entities/session/ui/role-tag'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import { Card, Descriptions, Flex, Space, Typography } from 'antd'

/**
 * Базовый dashboard widget с краткой информацией о текущей session.
 */
export function AdminDashboard() {
  const user = useCurrentUser()
  const role = getRoleMeta(user.role)

  return (
    <>
      <DocumentTitle title="Обзор" />
      <Flex gap={16} vertical>
        <Typography.Title level={2}>Обзор</Typography.Title>

        <Card>
          <Flex gap={24} vertical>
            <Space wrap>
              <RoleTag role={user.role} />
              <Typography.Text strong>{user.email}</Typography.Text>
            </Space>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Роль">{role.label}</Descriptions.Item>
            </Descriptions>
          </Flex>
        </Card>
      </Flex>
    </>
  )
}
