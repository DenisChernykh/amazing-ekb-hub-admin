import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { PlaceEditPage } from './place-edit-page'

vi.mock('@/widgets/place-edit/ui/place-edit-screen', () => ({
  PlaceEditScreen: ({ placeId }: { placeId: string }) => (
    <div>Place edit screen: {placeId}</div>
  ),
}))

describe('PlaceEditPage', () => {
  it('passes route place id to the edit screen', () => {
    render(
      <MemoryRouter initialEntries={['/places/place-2/edit']}>
        <Routes>
          <Route path="/places/:placeId/edit" element={<PlaceEditPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Place edit screen: place-2')).toBeInTheDocument()
  })

  it('redirects to places list when route param is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <Routes>
          <Route path="/broken" element={<PlaceEditPage />} />
          <Route path="/places" element={<div>Places list</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Places list')).toBeInTheDocument()
  })
})
