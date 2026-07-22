import {
  useCreatePlaceImportViewerAccessMutation,
  useRevokePlaceImportViewerAccessMutation,
} from '@/entities/place-import/model/place-import-mutations'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCaptchaViewer } from './use-captcha-viewer'

vi.mock('@/entities/place-import/model/place-import-mutations', () => ({
  useCreatePlaceImportViewerAccessMutation: vi.fn(),
  useRevokePlaceImportViewerAccessMutation: vi.fn(),
}))

describe('useCaptchaViewer', () => {
  const createMutate = vi.fn()
  const revokeMutate = vi.fn()
  const popup = {
    close: vi.fn(),
    location: { replace: vi.fn() },
    opener: window,
  }

  beforeEach(() => {
    createMutate.mockReset()
    revokeMutate.mockReset()
    popup.close.mockReset()
    popup.location.replace.mockReset()
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('opens popup synchronously and navigates it after capability creation', () => {
    let createOptions: Parameters<
      typeof useCreatePlaceImportViewerAccessMutation
    >[0]
    vi.mocked(useCreatePlaceImportViewerAccessMutation).mockImplementation(
      (options) => {
        createOptions = options
        return {
          isPending: false,
          mutate: createMutate,
        } as unknown as ReturnType<
          typeof useCreatePlaceImportViewerAccessMutation
        >
      },
    )
    vi.mocked(useRevokePlaceImportViewerAccessMutation).mockReturnValue({
      isPending: false,
      mutate: revokeMutate,
    } as unknown as ReturnType<typeof useRevokePlaceImportViewerAccessMutation>)

    const { result, unmount } = renderHook(() =>
      useCaptchaViewer('operation-1'),
    )
    act(() => result.current.open())
    expect(window.open).toHaveBeenCalledWith(
      'about:blank',
      'yandex-place-captcha',
      'popup,width=1280,height=800',
    )
    expect(createMutate).toHaveBeenCalledWith('operation-1')

    act(() =>
      createOptions?.onSuccess?.({
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        viewerUrl: 'https://viewer.example/#capability=secret',
      }),
    )
    expect(popup.opener).toBeNull()
    expect(popup.location.replace).toHaveBeenCalledWith(
      'https://viewer.example/#capability=secret',
    )
    act(() => result.current.open())
    expect(createMutate).toHaveBeenCalledTimes(1)
    expect(window.open).toHaveBeenCalledTimes(1)
    unmount()
    expect(popup.close).toHaveBeenCalled()
  })

  it('closes popup and marks access expired when TTL elapses', () => {
    let createOptions: Parameters<
      typeof useCreatePlaceImportViewerAccessMutation
    >[0]
    vi.mocked(useCreatePlaceImportViewerAccessMutation).mockImplementation(
      (options) => {
        createOptions = options
        return {
          isPending: false,
          mutate: createMutate,
        } as unknown as ReturnType<
          typeof useCreatePlaceImportViewerAccessMutation
        >
      },
    )
    vi.mocked(useRevokePlaceImportViewerAccessMutation).mockReturnValue({
      isPending: false,
      mutate: revokeMutate,
    } as unknown as ReturnType<typeof useRevokePlaceImportViewerAccessMutation>)
    const { result } = renderHook(() => useCaptchaViewer('operation-1'))

    act(() => result.current.open())
    act(() =>
      createOptions?.onSuccess?.({
        expiresAt: new Date(Date.now() + 1_000).toISOString(),
        viewerUrl: 'https://viewer.example/#capability=secret',
      }),
    )
    act(() => vi.advanceTimersByTime(1_000))

    expect(popup.close).toHaveBeenCalled()
    expect(result.current.expiresAt).toBeNull()
    expect(result.current.errorMessage).toContain('истекло')
  })

  it('delegates explicit revoke to the entity mutation', () => {
    vi.mocked(useCreatePlaceImportViewerAccessMutation).mockReturnValue({
      isPending: false,
      mutate: createMutate,
    } as unknown as ReturnType<typeof useCreatePlaceImportViewerAccessMutation>)
    vi.mocked(useRevokePlaceImportViewerAccessMutation).mockReturnValue({
      isPending: false,
      mutate: revokeMutate,
    } as unknown as ReturnType<typeof useRevokePlaceImportViewerAccessMutation>)
    const { result } = renderHook(() => useCaptchaViewer('operation-1'))

    act(() => result.current.revoke())

    expect(revokeMutate).toHaveBeenCalledWith('operation-1')
  })
})
