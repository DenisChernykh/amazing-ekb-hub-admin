import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MaterialsPage } from './materials-page'

vi.mock('@/widgets/material-library/ui/material-library-inbox', () => ({
  MaterialLibraryInbox: () => (
    <div>MaterialResponseDto library inbox widget</div>
  ),
}))

describe('MaterialsPage', () => {
  it('renders material library inbox widget', () => {
    render(<MaterialsPage />)

    expect(
      screen.getByText('MaterialResponseDto library inbox widget'),
    ).toBeInTheDocument()
  })
})
