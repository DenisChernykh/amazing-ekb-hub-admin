import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MaterialsPage } from './materials-page'

vi.mock('@/widgets/material-library/ui/material-library-inbox', () => ({
  MaterialLibraryInbox: () => <div>Material library inbox widget</div>,
}))

describe('MaterialsPage', () => {
  it('renders material library inbox widget', () => {
    render(<MaterialsPage />)

    expect(
      screen.getByText('Material library inbox widget'),
    ).toBeInTheDocument()
  })
})
