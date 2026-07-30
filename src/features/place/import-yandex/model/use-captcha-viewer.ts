import {
  useCreatePlaceImportViewerAccessMutation,
  useRevokePlaceImportViewerAccessMutation,
} from '@/entities/place-import/model/place-import-mutations'
import { isProblemCode } from '@/shared/api/client/api-errors'
import { getApiErrorPresentation } from '@/shared/api/presentation/api-error-presentation'
import { useEffect, useRef, useState } from 'react'

/** Состояние popup-доступа к CAPTCHA viewer. */
export type CaptchaViewerState = {
  errorMessage: string | null
  expiresAt: string | null
  isOpening: boolean
  isRevoking: boolean
  open: () => void
  revoke: () => void
}

/**
 * Управляет one-time capability, popup-окном, TTL и явным revoke CAPTCHA viewer.
 *
 * @remarks Effects синхронизируют внешние browser timer/window API. Popup создаётся
 * в click handler до HTTP-ответа, чтобы browser не счёл его нежелательным.
 */
export function useCaptchaViewer(operationId: string): CaptchaViewerState {
  const popupRef = useRef<Window | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const createAccess = useCreatePlaceImportViewerAccessMutation({
    onError: (error) => {
      popupRef.current?.close()
      popupRef.current = null
      setErrorMessage(
        isProblemCode(error, 'PLACE_IMPORT_VIEWER_UNAVAILABLE')
          ? 'Просмотр CAPTCHA временно недоступен.'
          : getApiErrorPresentation(error).message,
      )
    },
    onSuccess: (access) => {
      setExpiresAt(access.expiresAt)
      const popup = popupRef.current
      if (popup) {
        popup.opener = null
        popup.location.replace(access.viewerUrl)
      } else {
        setErrorMessage(
          'Браузер заблокировал окно CAPTCHA. Разрешите всплывающие окна и отзовите доступ перед повтором.',
        )
      }
    },
  })
  const revokeAccess = useRevokePlaceImportViewerAccessMutation({
    onError: (error) => {
      setErrorMessage(getApiErrorPresentation(error).message)
    },
    onSuccess: () => {
      popupRef.current?.close()
      popupRef.current = null
      setExpiresAt(null)
      setErrorMessage(null)
    },
  })

  useEffect(() => {
    return () => {
      popupRef.current?.close()
      popupRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!expiresAt) return

    const remainingMs = Math.max(0, new Date(expiresAt).getTime() - Date.now())
    const timeoutId = window.setTimeout(() => {
      popupRef.current?.close()
      popupRef.current = null
      setExpiresAt(null)
      setErrorMessage(
        'Время доступа к CAPTCHA истекло. Запросите новый доступ.',
      )
    }, remainingMs)

    return () => window.clearTimeout(timeoutId)
  }, [expiresAt])

  const open = () => {
    if (expiresAt || createAccess.isPending || revokeAccess.isPending) return

    setErrorMessage(null)
    popupRef.current = window.open(
      'about:blank',
      'yandex-place-captcha',
      'popup,width=1280,height=800',
    )
    createAccess.mutate(operationId)
  }
  const revoke = () => {
    if (revokeAccess.isPending) return

    setErrorMessage(null)
    revokeAccess.mutate(operationId)
  }

  return {
    errorMessage,
    expiresAt,
    isOpening: createAccess.isPending,
    isRevoking: revokeAccess.isPending,
    open,
    revoke,
  }
}
