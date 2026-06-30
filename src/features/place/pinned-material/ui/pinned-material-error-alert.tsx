import { Alert, Flex, Typography } from 'antd'

/**
 * Рендерит normalized ошибки назначения или снятия закрепленного материала.
 */
export function PinnedMaterialErrorAlert({
  messages,
  title,
}: {
  messages: string[]
  title: string
}) {
  return (
    <Alert
      description={
        <Flex gap={4} vertical>
          {messages.map((errorMessage) => (
            <Typography.Text key={errorMessage}>{errorMessage}</Typography.Text>
          ))}
        </Flex>
      }
      message={title}
      showIcon
      type="error"
    />
  )
}
