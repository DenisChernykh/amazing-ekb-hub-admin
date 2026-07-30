import { useUpdateContentSourceStatusMutation } from '@/entities/content-source/model/content-source-mutations'
import type {
  ContentSourceResponseDto,
  ContentSourceResponseDtoStatus,
} from '@/shared/api'
import { ApiClientError } from '@/shared/api/client/api-error'
import { fireEvent, render, screen } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ContentSourceStatusActions } from './content-source-status-actions'

vi.mock('@/entities/content-source/model/content-source-mutations', () => ({
  useUpdateContentSourceStatusMutation: vi.fn(),
}))

const messageError = vi.fn()
const messageSuccess = vi.fn()

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  const App = ({ children }: { children: ReactNode }) => <div>{children}</div>
  App.useApp = () => ({
    message: {
      error: messageError,
      success: messageSuccess,
    },
  })

  return {
    ...actual,
    App,
  }
})

const mockedUseUpdateContentSourceStatusMutation = vi.mocked(
  useUpdateContentSourceStatusMutation,
)

type StatusMutationCallbacks = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (contentSource: ContentSourceResponseDto) => void
}

type StatusMutationVariables = {
  sourceId: string
  status: ContentSourceResponseDtoStatus
}

const contentSource: ContentSourceResponseDto = {
  channelId: null,
  createdAt: '2026-06-15T10:00:00.000Z',
  displayName: 'Amazing EKB Telegram',
  externalId: null,
  handle: 'amazing_ekb',
  id: 'source-1',
  lastCursor: null,
  lastImportedAt: null,
  platform: 'telegram',
  status: 'active',
  updatedAt: '2026-06-15T10:00:00.000Z',
  url: 'https://t.me/amazing_ekb',
}

const renderActions = (source = contentSource) => {
  render(
    <AntdApp>
      <ContentSourceStatusActions contentSource={source} />
    </AntdApp>,
  )
}

describe('ContentSourceStatusActions', () => {
  beforeEach(() => {
    messageError.mockReset()
    messageSuccess.mockReset()
    mockedUseUpdateContentSourceStatusMutation.mockReset()
  })

  it('submits disable action for active source', () => {
    const mutate = vi.fn()
    mockedUseUpdateContentSourceStatusMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useUpdateContentSourceStatusMutation>)

    renderActions()

    fireEvent.click(screen.getByRole('button', { name: 'Отключить' }))

    expect(mutate).toHaveBeenCalledWith(
      {
        sourceId: 'source-1',
        status: 'disabled',
      },
      expect.any(Object),
    )
  })

  it('renders normalized status errors', async () => {
    mockedUseUpdateContentSourceStatusMutation.mockReturnValue({
      isPending: false,
      mutate: (
        _variables: StatusMutationVariables,
        callbacks?: StatusMutationCallbacks,
      ) => {
        callbacks?.onError?.(
          new ApiClientError({
            kind: 'server',
            message: 'Status unavailable',
            status: 500,
          }),
        )
      },
    } as unknown as ReturnType<typeof useUpdateContentSourceStatusMutation>)

    renderActions()

    fireEvent.click(screen.getByRole('button', { name: 'Отключить' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Status unavailable',
    )
    expect(messageError).toHaveBeenCalledWith('Status unavailable')
  })

  it('renders enable action for disabled source and disables while pending', () => {
    mockedUseUpdateContentSourceStatusMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateContentSourceStatusMutation>)

    renderActions({ ...contentSource, status: 'disabled' })

    expect(screen.getByRole('button', { name: 'Включить' })).toBeDisabled()
  })
})
