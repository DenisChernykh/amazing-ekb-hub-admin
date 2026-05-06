import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { PlaceDetailPage } from './place-detail-page'

vi.mock('@/widgets/place-detail/ui/place-detail-screen', () => ({
  PlaceDetailScreen: ({ placeId }: { placeId: string }) => (
    <div>Place detail screen: {placeId}</div>
  ),
}))

describe('PlaceDetailPage', () => {
  it('passes route place id to the detail screen', () => {
    render(
      <MemoryRouter initialEntries={['/places/place-2']}>
        <Routes>
          <Route path="/places/:placeId" element={<PlaceDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Place detail screen: place-2')).toBeInTheDocument()
  })

  it('redirects to places list when route param is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <Routes>
          <Route path="/broken" element={<PlaceDetailPage />} />
          <Route path="/places" element={<div>Places list</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Places list')).toBeInTheDocument()
  })
})
