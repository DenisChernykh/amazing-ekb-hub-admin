import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { buildAdminDocumentTitle } from './build-admin-document-title'
import { DocumentTitle } from './document-title'

describe('buildAdminDocumentTitle', () => {
  it('adds the admin suffix to screen titles', () => {
    expect(buildAdminDocumentTitle('Места')).toBe('Места | Amazing EKB Admin')
  })

  it('falls back to the base admin title for empty values', () => {
    expect(buildAdminDocumentTitle('   ')).toBe('Amazing EKB Admin')
    expect(buildAdminDocumentTitle(null)).toBe('Amazing EKB Admin')
  })
})

describe('DocumentTitle', () => {
  it('syncs document.title with the requested screen title', () => {
    const { rerender } = render(<DocumentTitle title="Места" />)

    expect(document.title).toBe('Места | Amazing EKB Admin')

    rerender(<DocumentTitle title="Новое место" />)

    expect(document.title).toBe('Новое место | Amazing EKB Admin')
  })
})
