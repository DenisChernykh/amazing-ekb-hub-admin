/**
 * Курируемая граница сгенерированного API для рукописного кода приложения.
 *
 * @remarks
 * Импорт локали выполняется до публикации Zod-схем. Generated-модули остаются
 * внутренней деталью `shared/api` и не импортируются напрямую из приложения.
 */
import '@/shared/config/zod-locale'

export {
  ApiNetworkError,
  ApiProblemError,
  ApiProtocolError,
  isProblemCode,
  normalizeApiError,
} from './client/api-errors'
export type {
  ApiClientError,
  ProblemCode,
  ProblemDocumentLike,
} from './client/api-errors'
export {
  getApiErrorMessage,
  getApiErrorPresentation,
  type ApiErrorPresentation,
  type ApiProblemMessages,
} from './presentation/api-error-presentation'

export { buildApiUrl, getApiBaseUrl, joinApiUrl } from './client/api-base-url'
export {
  clearCsrfToken,
  peekCsrfToken,
  setCsrfToken,
} from './client/csrf-token'

export {
  authGetCsrfToken,
  authGetMe,
  authLogin,
  authLogout,
  getAuthGetMeQueryKey,
  getAuthGetMeQueryOptions,
} from './generated/auth/auth'

export {
  adminCategoriesCreate,
  adminCategoriesDelete,
  adminCategoriesGet,
  adminCategoriesList,
  adminCategoriesUpdate,
  adminCategoriesUploadPhoto,
  getAdminCategoriesListQueryKey,
} from './generated/admin-categories/admin-categories'

export {
  adminContentSourcesCreate,
  adminContentSourcesList,
  adminContentSourcesUpdate,
  adminContentSourcesUpdateStatus,
  adminTelegramImportsEnqueue,
  getAdminContentSourcesListQueryKey,
} from './generated/admin-content-sources/admin-content-sources'

export {
  adminCollectionsAddPlace,
  adminCollectionsCreate,
  adminCollectionsDelete,
  adminCollectionsGet,
  adminCollectionsGetPhoto,
  adminCollectionsList,
  adminCollectionsRemovePhoto,
  adminCollectionsRemovePlace,
  adminCollectionsReorder,
  adminCollectionsReorderPlaces,
  adminCollectionsUpdate,
  adminCollectionsUpdateStatus,
  adminCollectionsUploadPhoto,
  getAdminCollectionsGetPhotoQueryKey,
  getAdminCollectionsGetQueryKey,
  getAdminCollectionsListQueryKey,
} from './generated/admin-collections/admin-collections'

export {
  adminImportRunsList,
  adminImportRunsStreamEvents,
  getAdminImportRunsListQueryKey,
} from './generated/admin-import-runs/admin-import-runs'

export {
  adminMaterialsList,
  adminMaterialsUpdate,
  adminMaterialsUpdateStatus,
  getAdminMaterialsListQueryKey,
} from './generated/admin-materials/admin-materials'

export {
  adminPlaceImportsCancel,
  adminPlaceImportsConfirm,
  adminPlaceImportsCreateViewerAccess,
  adminPlaceImportsGet,
  adminPlaceImportsGetActive,
  adminPlaceImportsGetEvents,
  adminPlaceImportsRevokeViewerAccess,
  adminPlaceImportsStart,
  adminPlaceImportsStreamEvents,
  getAdminPlaceImportsGetActiveQueryKey,
  getAdminPlaceImportsGetQueryKey,
} from './generated/admin-place-imports/admin-place-imports'

export {
  adminPlaceCollectionsReplace,
  adminPlaceMaterialsCreate,
  adminPlaceMaterialsHide,
  adminPlaceMaterialsLink,
  adminPlaceMaterialsList,
  adminPlaceMaterialsUpdateLink,
  adminPlacesClearPinnedMaterial,
  adminPlacesCreate,
  adminPlacesGet,
  adminPlacesList,
  adminPlacesSetPinnedMaterial,
  adminPlacesUpdate,
  adminPlacesUpdateStatus,
  adminPlacesUploadPhoto,
  getAdminPlaceMaterialsListQueryKey,
  getAdminPlacesGetQueryKey,
  getAdminPlacesListQueryKey,
} from './generated/admin-places/admin-places'

export {
  AdminCategoriesCreateBody,
  AdminCategoriesUpdateBody,
} from './generated-zod/admin-categories/admin-categories.zod'
export {
  AdminCollectionsAddPlaceBody,
  AdminCollectionsCreateBody,
  AdminCollectionsReorderBody,
  AdminCollectionsReorderPlacesBody,
  AdminCollectionsUpdateBody,
  AdminCollectionsUpdateStatusBody,
} from './generated-zod/admin-collections/admin-collections.zod'
export {
  AdminContentSourcesCreateBody,
  AdminContentSourcesUpdateBody,
} from './generated-zod/admin-content-sources/admin-content-sources.zod'
export { AdminImportRunsList200Response } from './generated-zod/admin-import-runs/admin-import-runs.zod'
export { AdminMaterialsUpdateBody } from './generated-zod/admin-materials/admin-materials.zod'
export {
  AdminPlaceImportsGet200Response,
  AdminPlaceImportsGetEvents200Response,
  AdminPlaceImportsStartBody,
} from './generated-zod/admin-place-imports/admin-place-imports.zod'
export {
  AdminPlaceMaterialsCreateBody,
  AdminPlacesCreateBody,
  AdminPlacesUpdateBody,
} from './generated-zod/admin-places/admin-places.zod'
export { AuthLoginBody as authLoginSchema } from './generated-zod/auth/auth.zod'

export type {
  AddCollectionPlaceDto,
  AdminCollectionDetailResponseDto,
  AdminCollectionDetailResponseDtoStatus,
  AdminCollectionListResponseDto,
  AdminCollectionPlaceResponseDto,
  AdminCollectionSummaryResponseDto,
  AdminCollectionSummaryResponseDtoStatus,
  AdminCollectionsUploadPhotoBody,
  AdminContentSourcesListParams,
  AdminImportRunsListParams,
  AdminMaterialLibraryListResponseDto,
  AdminMaterialLibraryResponseDto,
  AdminMaterialLibraryResponseDtoAdminStatus,
  AdminMaterialsListParams,
  AdminMaterialsListPlatform,
  AdminPlaceCollectionSummaryResponseDto,
  AdminPlaceListResponseDto,
  AdminPlaceMaterialsListParams,
  AdminPlaceSummaryResponseDto,
  AdminPlaceSummaryResponseDtoStatus,
  AdminPlacesListParams,
  AdminPlacesUploadPhotoBody,
  ContentSourceListResponseDto,
  ContentSourceResponseDto,
  ContentSourceResponseDtoPlatform,
  ContentSourceResponseDtoStatus,
  CreateCollectionDto,
  CreateContentSourceDto,
  CreateMaterialDto,
  CreatePlaceCategoryDto,
  CreatePlaceDto,
  CurrentUserResponseDto,
  ImportRunListResponseDto,
  ImportRunResponseDto,
  ImportRunResponseDtoStatus,
  LoginRequestDto,
  LoginResponseDto,
  MaterialListResponseDto,
  MaterialResponseDto,
  MaterialResponseDtoPlatform,
  MaterialResponseDtoType,
  PinnedMaterialResponseDto,
  PlaceCategoryListResponseDto,
  PlaceCategoryResponseDto,
  PlaceDetailResponseDto,
  PlaceImportEventsResponseDto,
  PlaceImportOperationResponseDto,
  PlaceImportOperationResponseDtoStatus,
  PlaceImportTargetResponseDto,
  PlaceImportViewerAccessResponseDto,
  PlaceSummaryCategoryResponseDto,
  PlaceSummaryResponseDto,
  ReorderCollectionPlacesDto,
  ReorderCollectionsDto,
  ReplacePlaceCollectionsDto,
  SetPinnedMaterialDto,
  StartPlaceImportDto,
  UpdateCollectionDto,
  UpdateCollectionStatusDto,
  UpdateContentSourceDto,
  UpdateMaterialDto,
  UpdatePlaceCategoryDto,
  UpdatePlaceDto,
  UpdatePlaceStatusDto,
} from './generated/model'
