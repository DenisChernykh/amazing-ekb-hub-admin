import { Alert, Flex } from 'antd'

/**
 * Props alert-а с нормализованными ошибками формы места.
 */
export type PlaceFormErrorAlertProps = {
  messages: string[]
  title: string
}

/**
 * Показывает нормализованные API-ошибки формы места.
 */
export function PlaceFormErrorAlert({
  messages,
  title,
}: PlaceFormErrorAlertProps) {
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
      title={title}
      type="error"
    />
  )
}
