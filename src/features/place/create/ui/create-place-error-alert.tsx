import { Alert, Flex } from 'antd'

type CreatePlaceErrorAlertProps = {
  messages: string[]
}

/**
 * Показывает нормализованные API-ошибки формы создания места.
 */
export function CreatePlaceErrorAlert({
  messages,
}: CreatePlaceErrorAlertProps) {
  return (
    <Alert
      description={
        <Flex gap={4} vertical>
          {messages.map((message) => (
            <span key={message}>{message}</span>
          ))}
        </Flex>
      }
      showIcon
      title="Не удалось создать место"
      type="error"
    />
  )
}
