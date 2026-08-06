import { useCreateCollectionMutation } from '@/entities/collection'
import { fireEvent, render, screen } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import { describe, expect, it, vi } from 'vitest'
import { CreateCollectionDrawer } from './create-collection-drawer'

vi.mock('@/entities/collection', () => ({
  useCreateCollectionMutation: vi.fn(),
}))

describe('CreateCollectionDrawer', () => {
  it('ignores Drawer close requests while creation is pending', () => {
    vi.mocked(useCreateCollectionMutation).mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    } as never)
    const onClose = vi.fn()
    render(
      <AntdApp>
        <CreateCollectionDrawer onClose={onClose} open />
      </AntdApp>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).not.toHaveBeenCalled()
  })
})
