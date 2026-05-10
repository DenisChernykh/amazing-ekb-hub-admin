import { Alert } from 'antd'

/**
 * Props блока ошибок формы материала.
 */
export type MaterialFormErrorAlertProps = {
  messages: string[]
  title: string
}

/**
 * Показывает нормализованные API-ошибки create/edit материала.
 */
export function MaterialFormErrorAlert({
  messages,
  title,
}: MaterialFormErrorAlertProps) {
  return (
    <Alert
      description={
        <ul>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      }
      showIcon
      title={title}
      type="error"
    />
  )
}
