import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ContentSourcesPage } from './content-sources-page'

vi.mock('@/widgets/content-sources/ui/content-sources-screen', () => ({
  ContentSourcesScreen: () => <div>Content sources screen widget</div>,
}))

describe('ContentSourcesPage', () => {
  it('renders content sources screen widget', () => {
    render(<ContentSourcesPage />)

    expect(
      screen.getByText('Content sources screen widget'),
    ).toBeInTheDocument()
  })
})
