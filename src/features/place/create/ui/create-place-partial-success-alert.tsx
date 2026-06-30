import { Alert, Button, Flex, Typography } from 'antd'
import { Link } from 'react-router'

/**
 * Рендерит предупреждение, когда место создано, но cover-фото не загрузилось.
 */
export function CreatePlacePartialSuccessAlert({
  messages,
  placeId,
}: {
  messages: string[]
  placeId: string
}) {
  return (
    <Alert
      description={
        <Flex gap={8} vertical>
          <Flex gap={4} vertical>
            {messages.map((errorMessage) => (
              <Typography.Text key={errorMessage}>
                {errorMessage}
              </Typography.Text>
            ))}
          </Flex>
          <Link to={`/places/${placeId}`}>
            <Button>Открыть созданное место</Button>
          </Link>
        </Flex>
      }
      message="Место создано, но cover-фото не загрузилось"
      showIcon
      type="warning"
    />
  )
}
