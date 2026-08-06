import { useCaptchaViewer } from '@/features/place/import-yandex/model/use-captcha-viewer'
import type { PlaceImportOperationResponseDto } from '@/shared/api'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlaceImportCaptchaPanel } from './place-import-captcha-panel'

vi.mock('@/features/place/import-yandex/model/use-captcha-viewer', () => ({
  useCaptchaViewer: vi.fn(),
}))

const operation: PlaceImportOperationResponseDto = {
  attempt: 1,
  captchaExpiresAt: '2026-07-22T11:00:00.000Z',
  category: null,
  createdAt: '2026-07-22T10:00:00.000Z',
  error: null,
  id: 'operation-1',
  mapsUrl: null,
  organizationId: null,
  outcome: null,
  possibleDuplicate: null,
  previewExpiresAt: null,
  resultPlaceId: null,
  sourceUrl: 'https://yandex.ru/maps/org/spa/1',
  status: 'awaiting_captcha',
  targetCollection: null,
  title: null,
  updatedAt: '2026-07-22T10:01:00.000Z',
  version: 2,
}

describe('PlaceImportCaptchaPanel', () => {
  it('allows revoking a stale viewer lease after route reload', () => {
    const revoke = vi.fn()
    vi.mocked(useCaptchaViewer).mockReturnValue({
      errorMessage: null,
      expiresAt: null,
      isOpening: false,
      isRevoking: false,
      open: vi.fn(),
      revoke,
    })

    render(<PlaceImportCaptchaPanel operation={operation} />)
    expect(
      screen.getByRole('button', { name: 'Открыть CAPTCHA' }),
    ).toBeEnabled()
    const button = screen.getByRole('button', { name: 'Отозвать доступ' })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(revoke).toHaveBeenCalled()
  })

  it('prevents replacing a locally active viewer capability', () => {
    vi.mocked(useCaptchaViewer).mockReturnValue({
      errorMessage: null,
      expiresAt: '2026-07-22T10:30:00.000Z',
      isOpening: false,
      isRevoking: false,
      open: vi.fn(),
      revoke: vi.fn(),
    })

    render(<PlaceImportCaptchaPanel operation={operation} />)

    expect(
      screen.getByRole('button', { name: 'Открыть CAPTCHA' }),
    ).toBeDisabled()
  })

  it('prevents revoke while viewer access creation is pending', () => {
    vi.mocked(useCaptchaViewer).mockReturnValue({
      errorMessage: null,
      expiresAt: null,
      isOpening: true,
      isRevoking: false,
      open: vi.fn(),
      revoke: vi.fn(),
    })

    render(<PlaceImportCaptchaPanel operation={operation} />)

    expect(
      screen.getByRole('button', { name: 'Отозвать доступ' }),
    ).toBeDisabled()
  })
})
