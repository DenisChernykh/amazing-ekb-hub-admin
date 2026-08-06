import { Alert } from 'antd'

/** Показывает список server/form ошибок коллекции. */
export function CollectionFormErrorAlert({ messages }: { messages: string[] }) {
  return (
    <Alert
      description={messages.join(' ')}
      showIcon
      title="Не удалось сохранить подборку"
      type="error"
    />
  )
}
