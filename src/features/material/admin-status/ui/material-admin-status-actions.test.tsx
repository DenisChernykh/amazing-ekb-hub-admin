import { useUpdateMaterialAdminStatusMutation } from '@/entities/material/model/material-mutations'
import type {
  AdminMaterialLibraryResponseDto,
  AdminMaterialLibraryResponseDtoAdminStatus,
} from '@/shared/api'
import { ApiClientError } from '@/shared/api/client/api-error'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MaterialAdminStatusActions } from './material-admin-status-actions'

vi.mock('@/entities/material/model/material-mutations', () => ({
  useUpdateMaterialAdminStatusMutation: vi.fn(),
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

const mockedUseUpdateMaterialAdminStatusMutation = vi.mocked(
  useUpdateMaterialAdminStatusMutation,
)

const material: AdminMaterialLibraryResponseDto = {
  adminStatus: 'pending',
  durationSec: null,
  excerpt: 'Пост из Telegram',
  externalId: '321',
  id: 'material-1',
  linked: false,
  mediaKind: 'photo',
  mediaPreviewUrl: null,
  platform: 'telegram',
  placeLink: null,
  publishedAt: '2026-03-20T10:30:00+05:00',
  source: {
    displayName: 'Amazing EKB Telegram',
    id: 'source-1',
    platform: 'telegram',
    url: 'https://t.me/amazing_ekb',
  },
  text: 'Пост из Telegram',
  title: null,
  type: 'post',
  url: 'https://t.me/amazing_ekb/321',
}

const renderActions = (value = material) => {
  render(
    <AntdApp>
      <MaterialAdminStatusActions material={value} />
    </AntdApp>,
  )
}

type StatusMutationCallbacks = {
  onError?: (error: ApiClientError) => void
  onSuccess?: (material: AdminMaterialLibraryResponseDto) => void
}

type StatusMutationVariables = {
  adminStatus: AdminMaterialLibraryResponseDtoAdminStatus
  materialId: string
}

describe('MaterialAdminStatusActions', () => {
  beforeEach(() => {
    messageError.mockReset()
    messageSuccess.mockReset()
    mockedUseUpdateMaterialAdminStatusMutation.mockReset()
  })

  it('submits approve action through entity mutation', () => {
    const mutate = vi.fn()
    mockedUseUpdateMaterialAdminStatusMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useUpdateMaterialAdminStatusMutation>)

    renderActions()

    fireEvent.click(screen.getByRole('button', { name: 'Одобрить' }))

    expect(mutate).toHaveBeenCalledWith(
      {
        adminStatus: 'approved',
        materialId: 'material-1',
      },
      expect.any(Object),
    )
  })

  it('shows success message after status update', async () => {
    mockedUseUpdateMaterialAdminStatusMutation.mockReturnValue({
      isPending: false,
      mutate: (
        _variables: StatusMutationVariables,
        callbacks?: StatusMutationCallbacks,
      ) => {
        callbacks?.onSuccess?.({ ...material, adminStatus: 'approved' })
      },
    } as unknown as ReturnType<typeof useUpdateMaterialAdminStatusMutation>)

    renderActions()

    fireEvent.click(screen.getByRole('button', { name: 'Одобрить' }))

    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('Материал одобрен')
    })
  })

  it('renders normalized error and keeps actions available for retry', async () => {
    mockedUseUpdateMaterialAdminStatusMutation.mockReturnValue({
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
    } as unknown as ReturnType<typeof useUpdateMaterialAdminStatusMutation>)

    renderActions()

    fireEvent.click(screen.getByRole('button', { name: 'Отклонить' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Status unavailable',
    )
    expect(messageError).toHaveBeenCalledWith('Status unavailable')
    expect(screen.getByRole('button', { name: 'Отклонить' })).not.toBeDisabled()
  })

  it('disables actions while status mutation is running', () => {
    mockedUseUpdateMaterialAdminStatusMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateMaterialAdminStatusMutation>)

    renderActions()

    expect(screen.getByRole('button', { name: 'Одобрить' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Отклонить' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'В архив' })).toBeDisabled()
  })
})
