import { Alert } from 'antd'

/**
 * Props блока ошибок формы категории.
 */
export type CategoryFormErrorAlertProps = {
  messages: string[]
  title: string
}

/**
 * Показывает нормализованные API-ошибки create/edit категории.
 */
export function CategoryFormErrorAlert({
  messages,
  title,
}: CategoryFormErrorAlertProps) {
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
