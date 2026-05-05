import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlacesCreatePage } from './places-create-page'

vi.mock('@/widgets/place-create/ui/place-create-screen', () => ({
  PlaceCreateScreen: () => <div>Create place widget</div>,
}))

describe('PlacesCreatePage', () => {
  it('delegates rendering to create place widget', () => {
    render(<PlacesCreatePage />)

    expect(screen.getByText('Create place widget')).toBeInTheDocument()
  })
})
