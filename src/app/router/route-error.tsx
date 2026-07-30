import { Button, Flex, Layout, Result, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useRevalidator, useRouteError } from 'react-router'
import { getRouteErrorPresentation } from './route-error-presentation'

/**
 * Показывает безопасное состояние ошибки React Router.
 *
 * @remarks Требует Data Router context. Повторяет только retryable route
 * errors через `revalidate()` и не выполняет auth redirect или другие
 * render-time side effects.
 */
export function RouteError(): ReactNode {
  const error = useRouteError()
  const revalidator = useRevalidator()
  const presentation = getRouteErrorPresentation(error)

  return (
    <Layout>
      <Flex align="center" justify="center" vertical>
        <Result
          extra={
            presentation.retryable && (
              <Button
                loading={revalidator.state === 'loading'}
                onClick={() => revalidator.revalidate()}
                type="primary"
              >
                Повторить
              </Button>
            )
          }
          status="error"
          subTitle={
            <Flex gap={8} vertical>
              <Typography.Text>{presentation.message}</Typography.Text>
              {Boolean(presentation.requestId) && (
                <Typography.Text type="secondary">
                  ID запроса: {presentation.requestId}
                </Typography.Text>
              )}
            </Flex>
          }
          title="Не удалось открыть страницу"
        />
      </Flex>
    </Layout>
  )
}
