import { Alert } from 'antd'

/**
 * Props блока ошибок формы content source.
 */
export type ContentSourceFormErrorAlertProps = {
  messages: string[]
  title: string
}

/**
 * Показывает нормализованные API-ошибки create/edit content source.
 */
export function ContentSourceFormErrorAlert({
  messages,
  title,
}: ContentSourceFormErrorAlertProps) {
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
