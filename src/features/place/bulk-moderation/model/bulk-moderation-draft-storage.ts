import { getPlaceStatusFromValue } from '@/entities/place/model/place-status'
import { isRecord } from '@/shared/lib/type/is-record'
import type { BulkModerationSelectedPlace } from './bulk-moderation-slice'

const BULK_MODERATION_DRAFT_SELECTION_VERSION = 1

/**
 * `sessionStorage` key для черновика выбора bulk moderation.
 */
export const BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY =
  'amazing-ekb-admin.bulk-moderation.draft-selection'

/**
 * Время жизни черновика выбора bulk moderation.
 */
export const BULK_MODERATION_DRAFT_SELECTION_TTL_MS = 30 * 60 * 1000

/**
 * Версионированный payload черновика выбора bulk moderation.
 */
export type BulkModerationDraftSelectionPayload = {
  places: BulkModerationSelectedPlace[]
  savedAt: number
  version: typeof BULK_MODERATION_DRAFT_SELECTION_VERSION
}

const getDraftStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

const toSelectedPlace = (
  value: unknown,
): BulkModerationSelectedPlace | null => {
  if (!isRecord(value)) {
    return null
  }

  const rawStatus =
    typeof value.status === 'string' || typeof value.status === 'number'
      ? value.status
      : null
  const status = getPlaceStatusFromValue(rawStatus)

  if (
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    !status
  ) {
    return null
  }

  return {
    id: value.id,
    status,
    title: value.title,
  }
}

const parseDraftPayload = (
  value: unknown,
): BulkModerationDraftSelectionPayload | null => {
  if (
    !isRecord(value) ||
    value.version !== BULK_MODERATION_DRAFT_SELECTION_VERSION ||
    typeof value.savedAt !== 'number' ||
    !Number.isFinite(value.savedAt) ||
    !Array.isArray(value.places)
  ) {
    return null
  }

  if (Date.now() - value.savedAt >= BULK_MODERATION_DRAFT_SELECTION_TTL_MS) {
    return null
  }

  const places: BulkModerationSelectedPlace[] = []

  for (const place of value.places) {
    const selectedPlace = toSelectedPlace(place)

    if (!selectedPlace) {
      return null
    }

    places.push(selectedPlace)
  }

  return {
    places,
    savedAt: value.savedAt,
    version: BULK_MODERATION_DRAFT_SELECTION_VERSION,
  }
}

/**
 * Сохраняет черновик выбранных мест в `sessionStorage`.
 *
 * @remarks Пишет только минимальные снимки `id/status/title`; пустой выбор удаляет черновик.
 */
export function saveBulkModerationDraftSelection(
  places: BulkModerationSelectedPlace[],
) {
  const storage = getDraftStorage()

  if (!storage) {
    return
  }

  if (places.length === 0) {
    clearBulkModerationDraftSelection()
    return
  }

  try {
    storage.setItem(
      BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      JSON.stringify({
        places: places.map((place) => ({
          id: place.id,
          status: place.status,
          title: place.title,
        })),
        savedAt: Date.now(),
        version: BULK_MODERATION_DRAFT_SELECTION_VERSION,
      }),
    )
  } catch {
    clearBulkModerationDraftSelection()
  }
}

/**
 * Читает валидный черновик выбора bulk moderation из `sessionStorage`.
 *
 * @remarks Удаляет payload, если он истек, не поддерживается текущей версией или поврежден.
 */
export function readBulkModerationDraftSelection(): BulkModerationDraftSelectionPayload | null {
  const storage = getDraftStorage()

  if (!storage) {
    return null
  }

  const rawDraft = storage.getItem(BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY)

  if (!rawDraft) {
    return null
  }

  try {
    const draft = parseDraftPayload(JSON.parse(rawDraft))

    if (!draft) {
      clearBulkModerationDraftSelection()
    }

    return draft
  } catch {
    clearBulkModerationDraftSelection()
    return null
  }
}

/**
 * Удаляет черновик выбора bulk moderation из `sessionStorage`.
 */
export function clearBulkModerationDraftSelection() {
  const storage = getDraftStorage()

  if (!storage) {
    return
  }

  storage.removeItem(BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY)
}

/**
 * Возвращает только те места черновика, которые есть в текущем загруженном списке.
 *
 * @remarks Снимки берутся из свежего списка, чтобы не считать `sessionStorage` источником истины.
 */
export function getRestorableBulkModerationDraftPlaces(
  draft: BulkModerationDraftSelectionPayload,
  loadedPlaces: BulkModerationSelectedPlace[],
): BulkModerationSelectedPlace[] {
  const loadedPlaceById = new Map(
    loadedPlaces.map((place) => [
      place.id,
      {
        id: place.id,
        status: place.status,
        title: place.title,
      },
    ]),
  )
  const restoredIds = new Set<string>()
  const restorablePlaces: BulkModerationSelectedPlace[] = []

  for (const draftPlace of draft.places) {
    const loadedPlace = loadedPlaceById.get(draftPlace.id)

    if (!loadedPlace || restoredIds.has(loadedPlace.id)) {
      continue
    }

    restorablePlaces.push(loadedPlace)
    restoredIds.add(loadedPlace.id)
  }

  return restorablePlaces
}
