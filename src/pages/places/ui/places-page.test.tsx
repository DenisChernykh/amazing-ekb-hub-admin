import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlacesPage } from './places-page'

vi.mock('@/widgets/places-list/ui/places-list', () => ({
  PlacesList: () => <div>Places list widget</div>,
}))

describe('PlacesPage', () => {
  it('renders places list widget', () => {
    render(<PlacesPage />)

    expect(screen.getByText('Places list widget')).toBeInTheDocument()
  })
})
