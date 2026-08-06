import { useUpdateCollectionMutation } from '@/entities/collection'
import type { AdminCollectionSummaryResponseDto } from '@/shared/api'
import { createApiProblemError } from '@/test/api-problem'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditCollectionDrawer } from './edit-collection-drawer'

vi.mock('@/entities/collection', () => ({
  useUpdateCollectionMutation: vi.fn(),
}))

const collection = {
  activePlaceCount: 1,
  coverImageUrl: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  description: 'Old description',
  hiddenPlaceCount: 0,
  id: 'collection-1',
  position: 0,
  slug: 'spa',
  status: 'draft',
  title: 'SPA',
  updatedAt: '2026-08-01T00:00:00.000Z',
} satisfies AdminCollectionSummaryResponseDto

describe('EditCollectionDrawer', () => {
  beforeEach(() => vi.mocked(useUpdateCollectionMutation).mockReset())

  it('submits edited title, slug and description and closes after success', async () => {
    const onClose = vi.fn()
    let mutationOptions: { onSuccess?: () => void } = {}
    const mutate = vi.fn(() => mutationOptions.onSuccess?.())
    vi.mocked(useUpdateCollectionMutation).mockImplementation((options) => {
      mutationOptions = options as typeof mutationOptions
      return { isPending: false, mutate } as never
    })
    const user = userEvent.setup()
    render(
      <AntdApp>
        <EditCollectionDrawer collection={collection} onClose={onClose} />
      </AntdApp>,
    )

    await user.clear(screen.getByRole('textbox', { name: 'Название' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Название' }),
      'New SPA',
    )
    await user.clear(screen.getByRole('textbox', { name: 'Описание' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Описание' }),
      'New description',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        collectionId: 'collection-1',
        data: {
          description: 'New description',
          slug: 'spa',
          title: 'New SPA',
        },
      })
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('shows a safe backend error and keeps the drawer open for retry', async () => {
    const onClose = vi.fn()
    let mutationOptions: { onError?: (error: unknown) => void } = {}
    vi.mocked(useUpdateCollectionMutation).mockImplementation((options) => {
      mutationOptions = options as typeof mutationOptions
      return {
        isPending: false,
        mutate: vi.fn(() =>
          mutationOptions.onError?.(
            createApiProblemError('COLLECTION_NOT_FOUND', 404),
          ),
        ),
      } as never
    })
    render(
      <AntdApp>
        <EditCollectionDrawer collection={collection} onClose={onClose} />
      </AntdApp>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Подборка не найдена.',
    )
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeEnabled()
  })
})
