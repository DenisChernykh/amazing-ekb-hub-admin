import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { PlaceCreateScreen } from './place-create-screen'

vi.mock('@/features/place/create/ui/create-place-form', () => ({
  CreatePlaceForm: ({
    onCancel,
    onCreated,
  }: {
    onCancel: () => void
    onCreated: () => void
  }) => (
    <div>
      <button onClick={onCreated}>created</button>
      <button onClick={onCancel}>cancel</button>
    </div>
  ),
}))

const renderPlaceCreateScreen = () => {
  const router = createMemoryRouter(
    [
      {
        path: '/places/new',
        element: <PlaceCreateScreen />,
      },
      {
        path: '/places',
        element: <div>Places list route</div>,
      },
    ],
    {
      initialEntries: ['/places/new'],
    },
  )

  render(<RouterProvider router={router} />)
}

describe('PlaceCreateScreen', () => {
  it('renders create place title', () => {
    renderPlaceCreateScreen()

    expect(document.title).toBe('Новое место | Amazing EKB Admin')
    expect(
      screen.getByRole('heading', { name: 'Новое место' }),
    ).toBeInTheDocument()
  })

  it('returns to places list after form success', async () => {
    renderPlaceCreateScreen()

    await userEvent.click(screen.getByRole('button', { name: 'created' }))

    expect(screen.getByText('Places list route')).toBeInTheDocument()
  })

  it('returns to places list after cancellation', async () => {
    renderPlaceCreateScreen()

    await userEvent.click(screen.getByRole('button', { name: 'cancel' }))

    expect(screen.getByText('Places list route')).toBeInTheDocument()
  })
})
