import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { createApiProblemError } from '@/test/api-problem'

import { RouteError } from './route-error'

function renderErrorRoute(loader: () => Promise<null>) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        loader,
        element: <p>Protected content</p>,
        errorElement: <RouteError />,
      },
    ],
    { initialEntries: ['/'] },
  )

  render(
    <AntdApp>
      <RouterProvider router={router} />
    </AntdApp>,
  )

  return router
}

describe('RouteError', () => {
  it('renders safe route-specific forbidden copy without a retry action', async () => {
    const backendError = createApiProblemError('AUTHORIZATION_DENIED', 403)

    renderErrorRoute(async () => {
      throw backendError
    })

    expect(
      await screen.findByText('Не удалось открыть страницу'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Недостаточно прав для открытия страницы.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Повторить' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(backendError.problem.title),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(backendError.problem.detail),
    ).not.toBeInTheDocument()
  })

  it('shows request diagnostics and retries a retryable route error', async () => {
    const backendError = createApiProblemError('INTERNAL_ERROR', 503, {
      requestId: 'request-route-retry',
    })
    const loader = vi
      .fn<() => Promise<null>>()
      .mockRejectedValueOnce(backendError)
      .mockResolvedValue(null)
    const user = userEvent.setup()

    renderErrorRoute(loader)

    expect(
      await screen.findByText('Не удалось выполнить запрос.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('ID запроса: request-route-retry'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(backendError.problem.title),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(backendError.problem.detail),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(await screen.findByText('Protected content')).toBeInTheDocument()
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
