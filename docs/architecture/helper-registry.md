# Helper Registry

This registry is the first place to check before creating a helper.

## Rule

Before adding a helper, search this file and the referenced source file. Reuse the existing helper when the contract matches. If the existing helper is private but the behavior is now needed in another file, promote it to the nearest valid shared layer and update this registry in the same change.

Do not move helpers to `shared` only because they are small. Move them when the behavior is repeated or expresses a shared contract.

## Shared API Client

| Helper              | Location                                 | Visibility | Contract                                                                                                                       |
| ------------------- | ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `normalizeApiError` | `src/shared/api/client/api-error.ts`     | exported   | Converts Axios, network, and unknown errors to `ApiClientError`.                                                               |
| `isApiClientError`  | `src/shared/api/client/api-error.ts`     | exported   | Narrows unknown errors to `ApiClientError`.                                                                                    |
| `getApiErrorStatus` | `src/shared/api/client/api-error.ts`     | exported   | Reads HTTP status from a normalized API error.                                                                                 |
| `apiMutator`        | `src/shared/api/client/orval-mutator.ts` | exported   | Orval custom mutator that sends generated requests through the shared Axios client.                                            |
| `shouldSkipRefresh` | `src/shared/api/client/api-client.ts`    | private    | Detects auth endpoints that must not trigger refresh retry. Promote only if another transport needs the same auth-loop rule.   |
| `requestRefresh`    | `src/shared/api/client/api-client.ts`    | private    | Shares one in-flight refresh request between concurrent 401 responses. Keep transport-local unless another API client appears. |

## Shared Number Helpers

| Helper                 | Location                                          | Visibility | Contract                                                                        |
| ---------------------- | ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `parsePositiveInteger` | `src/shared/lib/number/parse-positive-integer.ts` | exported   | Parses positive integer URL/form values and returns a caller-provided fallback. |

## Shared UI

| Helper                    | Location                                                     | Visibility | Contract                                                                              |
| ------------------------- | ------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------- |
| `buildAdminDocumentTitle` | `src/shared/ui/document-title/build-admin-document-title.ts` | exported   | Builds a browser title with the shared `Amazing EKB Admin` suffix.                    |
| `DocumentTitle`           | `src/shared/ui/document-title/document-title.tsx`            | exported   | Synchronizes `document.title` for route and screen components.                        |
| `ScreenLoadingState`      | `src/shared/ui/screen-state/screen-loading-state.tsx`        | exported   | Renders standardized full-screen loading state for screen-level queries.              |
| `ScreenResultState`       | `src/shared/ui/screen-state/screen-result-state.tsx`         | exported   | Renders standardized forbidden/not-found/error result states with optional actions.   |
| `ScreenApiErrorState`     | `src/shared/ui/screen-state/screen-api-error-state.tsx`      | exported   | Maps normalized API errors to forbidden, not-found, or generic screen-level error UI. |
| `ScreenEmptyState`        | `src/shared/ui/screen-state/screen-empty-state.tsx`          | exported   | Renders reusable empty state with optional primary and reset/filter actions.          |
| `ScreenStateAction`       | `src/shared/ui/screen-state/screen-state-action.tsx`         | exported   | Describes Ant Design button actions used by shared screen-state components.           |

## App State

| Helper           | Location                 | Visibility | Contract                                                           |
| ---------------- | ------------------------ | ---------- | ------------------------------------------------------------------ |
| `createAppStore` | `src/app/store.ts`       | exported   | Creates an isolated Redux store instance for app runtime or tests. |
| `store`          | `src/app/store.ts`       | exported   | Runtime Redux store used by `AppProviders`.                        |
| `useAppDispatch` | `src/app/store-hooks.ts` | exported   | Typed Redux dispatch hook for app-level state changes.             |
| `useAppSelector` | `src/app/store-hooks.ts` | exported   | Typed Redux selector hook for reading app-level state.             |

## Session Entity

| Helper                      | Location                                  | Visibility | Contract                                                      |
| --------------------------- | ----------------------------------------- | ---------- | ------------------------------------------------------------- |
| `getCurrentSessionQueryKey` | `src/entities/session/api/session-api.ts` | exported   | Returns the React Query key for the current backend session.  |
| `invalidateCurrentSession`  | `src/entities/session/api/session-api.ts` | exported   | Invalidates the current session query after login or refresh. |
| `removeCurrentSession`      | `src/entities/session/api/session-api.ts` | exported   | Removes the current session query after logout.               |
| `getRoleMeta`               | `src/entities/session/ui/role-meta.ts`    | exported   | Maps backend `Role` to localized Ant Design tag metadata.     |

## Place Entity

| Helper                             | Location                                       | Visibility | Contract                                                                                        |
| ---------------------------------- | ---------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `PLACE_CATEGORY_VALUES`            | `src/entities/place/model/place-categories.ts` | exported   | Provides backend place categories in a stable order for UI controls.                            |
| `getPlaceStatusFromValue`          | `src/entities/place/model/place-status.ts`     | exported   | Normalizes raw UI/URL values to supported backend place statuses.                               |
| `useCreatePlaceMutation`           | `src/entities/place/model/place-mutations.ts`  | exported   | Creates a place through admin API and invalidates all admin places list query variants.         |
| `useUpdatePlaceMutation`           | `src/entities/place/model/place-mutations.ts`  | exported   | Updates place fields through admin API and invalidates admin places list/detail caches.         |
| `useUpdatePlaceStatusMutation`     | `src/entities/place/model/place-mutations.ts`  | exported   | Updates place publication status and invalidates admin places list/detail caches.               |
| `useUploadPlaceCoverPhotoMutation` | `src/entities/place/model/place-mutations.ts`  | exported   | Uploads/replaces a place cover photo and invalidates admin places list/detail caches.           |
| `useSetPinnedMaterialMutation`     | `src/entities/place/model/place-mutations.ts`  | exported   | Sets a place pinned material through admin API and invalidates admin place detail cache.        |
| `useClearPinnedMaterialMutation`   | `src/entities/place/model/place-mutations.ts`  | exported   | Clears a place pinned material through admin API and invalidates admin place detail cache.      |
| `invalidatePlacesListQueries`      | `src/entities/place/model/place-mutations.ts`  | exported   | Invalidates admin places list cache after admin place mutations.                                |
| `invalidateAdminPlaceDetailQuery`  | `src/entities/place/model/place-mutations.ts`  | exported   | Invalidates one admin place detail cache after admin place mutations.                           |
| `usePlacesListQuery`               | `src/entities/place/model/place-hooks.ts`      | exported   | Loads the admin places list through the admin endpoint, including hidden places when requested. |
| `useAdminPlaceDetailQuery`         | `src/entities/place/model/place-hooks.ts`      | exported   | Loads admin place detail independently of public visibility.                                    |
| `getPlaceCategoryOptions`          | `src/entities/place/ui/place-meta.ts`          | exported   | Maps backend place categories to localized Ant Design select options.                           |
| `getPlaceCategoryMeta`             | `src/entities/place/ui/place-meta.ts`          | exported   | Maps backend `PlaceCategory` to localized Ant Design tag metadata.                              |
| `getPlaceStatusMeta`               | `src/entities/place/ui/place-meta.ts`          | exported   | Maps backend `PlaceStatus` to localized Ant Design tag metadata.                                |

## Material Entity

| Helper                              | Location                                                | Visibility | Contract                                                                                           |
| ----------------------------------- | ------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `usePlaceMaterialsListQuery`        | `src/entities/material/model/material-hooks.ts`         | exported   | Loads place materials through the admin bounded materials read endpoint.                           |
| `useCreatePlaceMaterialMutation`    | `src/entities/material/model/material-mutations.ts`     | exported   | Creates place material through admin API and invalidates bounded materials list plus admin detail. |
| `useUpdateMaterialMutation`         | `src/entities/material/model/material-mutations.ts`     | exported   | Updates material through admin API and invalidates bounded materials list plus admin detail.       |
| `invalidatePlaceMaterialsListQuery` | `src/entities/material/model/material-mutations.ts`     | exported   | Invalidates one bounded admin materials list after material mutations.                             |
| `isSafeMaterialUrl`                 | `src/entities/material/model/material-url.ts`           | exported   | Checks that material links are absolute `http` or `https` URLs before rendering or API payloads.   |
| `getMaterialUrlValidationError`     | `src/entities/material/model/material-url.ts`           | exported   | Returns the local material URL validation message while leaving empty values to required rules.    |
| `normalizeMaterialUrl`              | `src/entities/material/model/material-url.ts`           | exported   | Trims material URLs and rejects non-`http/https` payload values before API submission.             |
| `MATERIAL_PLATFORM_VALUES`          | `src/entities/material/ui/material-meta.ts`             | exported   | Provides backend material platforms in a stable order for UI controls.                             |
| `MATERIAL_TYPE_VALUES`              | `src/entities/material/ui/material-meta.ts`             | exported   | Provides backend material types in a stable order for UI controls.                                 |
| `getMaterialPlatformMeta`           | `src/entities/material/ui/material-meta.ts`             | exported   | Maps backend `Platform` to localized Ant Design tag metadata.                                      |
| `getMaterialTypeMeta`               | `src/entities/material/ui/material-meta.ts`             | exported   | Maps backend `MaterialType` to localized Ant Design tag metadata.                                  |
| `getMaterialPlatformOptions`        | `src/entities/material/ui/material-meta.ts`             | exported   | Maps backend platforms to localized Ant Design select options.                                     |
| `getMaterialTypeOptions`            | `src/entities/material/ui/material-meta.ts`             | exported   | Maps backend material types to localized Ant Design select options.                                |
| `formatMaterialDuration`            | `src/entities/material/ui/material-meta.ts`             | exported   | Formats nullable material duration as `m:ss`, `h:mm:ss`, or `—` for list/detail UI.                |
| `formatMaterialPublishedDate`       | `src/entities/material/ui/material-meta.ts`             | exported   | Formats material publication date from source ISO date part without UTC day shifts.                |
| `PlaceMaterialsPanel`               | `src/widgets/place-detail/ui/place-materials-panel.tsx` | exported   | Renders bounded materials table on admin place detail with create/edit drawer actions.             |

## Auth UI

| Helper            | Location                                          | Visibility | Contract                                                                                                                                         |
| ----------------- | ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getRedirectPath` | `src/widgets/auth-login/ui/auth-login-screen.tsx` | private    | Converts React Router login state into a safe post-login redirect path. Promote to an auth routing helper if another login-like screen needs it. |

## Places List Widget

| Helper                              | Location                                                         | Visibility | Contract                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `getSelectedNavigationKey`          | `src/widgets/admin-shell/model/navigation.ts`                    | exported   | Maps the current pathname, including nested section routes, to the selected admin sidebar item. |
| `setDefaultAwareParam`              | `src/widgets/places-list/model/pagination.ts`                    | private    | Writes pagination search params and removes values equal to defaults.                           |
| `getPlacesListPaginationFromSearch` | `src/widgets/places-list/model/pagination.ts`                    | exported   | Reads `page` and `pageSize` from URL search params with safe defaults.                          |
| `getPlacesListStatusFromValue`      | `src/widgets/places-list/model/pagination.ts`                    | exported   | Normalizes raw UI/URL status values; only `active` and `hidden` become backend filters.         |
| `getPlacesListStatusFromSearch`     | `src/widgets/places-list/model/pagination.ts`                    | exported   | Reads admin status filter from URL search params; missing/invalid means all statuses.           |
| `buildPlacesListPaginationSearch`   | `src/widgets/places-list/model/pagination.ts`                    | exported   | Builds default-aware URL search params after changing list pagination.                          |
| `buildPlacesListStatusSearch`       | `src/widgets/places-list/model/pagination.ts`                    | exported   | Builds URL search params after changing status filter and resets the page to default.           |
| `usePlacesListRowSelection`         | `src/widgets/places-list/model/use-places-list-row-selection.ts` | exported   | Builds Ant Design table row selection from the bulk moderation store and visible place rows.    |
| `placesTableColumns`                | `src/widgets/places-list/ui/places-table-columns.tsx`            | exported   | Defines read-only Ant Design table columns for `PlaceSummary` rows with admin detail links.     |

## Place Form Feature

| Helper                      | Location                                                | Visibility | Contract                                                                                                                                               |
| --------------------------- | ------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PlaceFormValues`           | `src/features/place/form/model/place-form.ts`           | exported   | Defines create/edit place form values, including optional `summary`/`tags`, before conversion to generated API payloads.                               |
| `getPlaceFormInitialValues` | `src/features/place/form/model/place-form.ts`           | exported   | Maps admin `PlaceDetail` to form initial values.                                                                                                       |
| `toCreatePlaceRequest`      | `src/features/place/form/model/place-form.ts`           | exported   | Normalizes form values into `POST /admin/places` payload, preserving empty optional `summary`/`tags` as `''` and `[]`.                                 |
| `toUpdatePlaceRequest`      | `src/features/place/form/model/place-form.ts`           | exported   | Builds a normalized partial `PATCH /admin/places/{placeId}` payload from changed fields only, including explicit clears for optional `summary`/`tags`. |
| `hasPlaceFormChanges`       | `src/features/place/form/model/place-form.ts`           | exported   | Detects whether normalized form values differ from the loaded server values.                                                                           |
| `PlaceFormErrorAlert`       | `src/features/place/form/ui/place-form-error-alert.tsx` | exported   | Renders normalized create/edit place API errors without parsing backend field names.                                                                   |
| `PlaceFormFields`           | `src/features/place/form/ui/place-form-fields.tsx`      | exported   | Renders shared Ant Design fields for create/edit place forms.                                                                                          |
| `EditPlaceForm`             | `src/features/place/edit/ui/edit-place-form.tsx`        | exported   | Edits place fields, tracks dirty state, and submits partial update payloads through the entity.                                                        |
| `CreatePlaceForm`           | `src/features/place/create/ui/create-place-form.tsx`    | exported   | Creates places using the shared place form fields and create mutation bridge.                                                                          |
| `PlaceEditScreen`           | `src/widgets/place-edit/ui/place-edit-screen.tsx`       | exported   | Loads admin detail, hosts edit form, and blocks dirty in-app navigation.                                                                               |

## Place Status Feature

| Helper             | Location                                              | Visibility | Contract                                                                                    |
| ------------------ | ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| `PlaceStatusPanel` | `src/features/place/status/ui/place-status-panel.tsx` | exported   | Renders admin publish/hide controls and submits status changes through the entity mutation. |

## Place Bulk Moderation Feature

| Helper                               | Location                                                                    | Visibility | Contract                                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `bulkModerationReducer`              | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`         | exported   | Owns in-memory workflow state for bulk place moderation: selection, queue, progress, retry, and undo. |
| `bulkModerationActions`              | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`         | exported   | Action creators for local bulk moderation workflow transitions.                                       |
| `selectBulkModerationSelectedIds`    | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`         | exported   | Returns selected place ids for Ant Design table row selection.                                        |
| `selectBulkModerationSelectedPlaces` | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`         | exported   | Returns selected place snapshots in stable selection order.                                           |
| `selectBulkModerationQueueItems`     | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`         | exported   | Returns current operation queue items in stable order.                                                |
| `selectBulkModerationFailedItems`    | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`         | exported   | Returns failed queue items for retry actions.                                                         |
| `selectBulkModerationSucceededItems` | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`         | exported   | Returns succeeded queue items for undo actions.                                                       |
| `BulkModerationToolbar`              | `src/features/place/bulk-moderation/ui/bulk-moderation-toolbar.tsx`         | exported   | Renders selected count and bulk publish/hide/reset actions over the places table.                     |
| `BulkModerationProgressDrawer`       | `src/features/place/bulk-moderation/ui/bulk-moderation-progress-drawer.tsx` | exported   | Renders queue progress, partial errors, retry failed, and undo succeeded actions.                     |

## Place Cover Feature

| Helper                              | Location                                                     | Visibility | Contract                                                                                        |
| ----------------------------------- | ------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| `PLACE_COVER_UPLOAD_MAX_SIZE_BYTES` | `src/features/place/cover/model/place-cover-upload.ts`       | exported   | Defines backend-aligned cover photo size limit for UI validation.                               |
| `PLACE_COVER_UPLOAD_MIME_TYPES`     | `src/features/place/cover/model/place-cover-upload.ts`       | exported   | Defines backend-aligned cover photo MIME allowlist.                                             |
| `PLACE_COVER_UPLOAD_ACCEPT`         | `src/features/place/cover/model/place-cover-upload.ts`       | exported   | Formats the cover upload MIME allowlist for Ant Design Upload/input accept.                     |
| `getPlaceCoverUploadError`          | `src/features/place/cover/model/place-cover-upload.ts`       | exported   | Returns a local validation error for unsupported cover upload files, or `null` for valid files. |
| `PlaceCoverPreview`                 | `src/features/place/cover/ui/place-cover-preview.tsx`        | exported   | Renders selected cover preview, current cover image, or empty state.                            |
| `PlaceCoverUploadActions`           | `src/features/place/cover/ui/place-cover-upload-actions.tsx` | exported   | Renders choose/upload/reset controls for the cover upload panel.                                |
| `PlaceCoverUploadPanel`             | `src/features/place/cover/ui/place-cover-upload-panel.tsx`   | exported   | Renders current cover preview, local file validation, upload submit, and normalized API errors. |

## Place Pinned Material Feature

| Helper                       | Location                                                          | Visibility | Contract                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `toSetPinnedMaterialRequest` | `src/features/place/pinned-material/model/pinned-material.ts`     | exported   | Builds `PATCH /admin/places/{placeId}/pinned-material` payload or returns `null` for non-assign values.         |
| `PinnedMaterialPanel`        | `src/features/place/pinned-material/ui/pinned-material-panel.tsx` | exported   | Renders current pinned material, set/change selector, and clear action using the loaded bounded materials list. |

## Material Form Feature

| Helper                         | Location                                                      | Visibility | Contract                                                                                                 |
| ------------------------------ | ------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `MaterialFormValues`           | `src/features/material/form/model/material-form.ts`           | exported   | Defines create/edit material form values before conversion to generated API payloads.                    |
| `MaterialFormChangedField`     | `src/features/material/form/model/material-form.ts`           | exported   | Describes a normalized changed material field shown as an edit drawer diff chip.                         |
| `getMaterialFormInitialValues` | `src/features/material/form/model/material-form.ts`           | exported   | Maps admin `Material` to form initial values.                                                            |
| `toCreateMaterialRequest`      | `src/features/material/form/model/material-form.ts`           | exported   | Normalizes form values into `POST /admin/places/{placeId}/materials` payload with local offset datetime. |
| `toUpdateMaterialRequest`      | `src/features/material/form/model/material-form.ts`           | exported   | Builds a normalized partial `PATCH /admin/materials/{materialId}` payload from changed fields only.      |
| `hasMaterialFormChanges`       | `src/features/material/form/model/material-form.ts`           | exported   | Detects whether normalized material form values differ from loaded server values.                        |
| `getMaterialFormChangedFields` | `src/features/material/form/model/material-form.ts`           | exported   | Returns normalized changed field labels for edit drawer chips.                                           |
| `MaterialFormErrorAlert`       | `src/features/material/form/ui/material-form-error-alert.tsx` | exported   | Renders normalized create/edit material API errors without parsing backend field names.                  |
| `MaterialFormFields`           | `src/features/material/form/ui/material-form-fields.tsx`      | exported   | Renders shared Ant Design fields for create/edit material forms.                                         |
| `CreateMaterialDrawer`         | `src/features/material/create/ui/create-material-drawer.tsx`  | exported   | Creates place materials in a guarded Ant Design drawer through the entity mutation bridge.               |
| `EditMaterialDrawer`           | `src/features/material/edit/ui/edit-material-drawer.tsx`      | exported   | Edits material fields in a guarded Ant Design drawer with dirty diff chips and partial update payloads.  |

## API Error Internals

| Helper            | Location                             | Visibility | Contract                                                                        |
| ----------------- | ------------------------------------ | ---------- | ------------------------------------------------------------------------------- |
| `isRecord`        | `src/shared/api/client/api-error.ts` | private    | Narrows unknown values to object records before reading NestJS error fields.    |
| `toNestErrorBody` | `src/shared/api/client/api-error.ts` | private    | Treats object-like response data as a possible NestJS error body.               |
| `getMessages`     | `src/shared/api/client/api-error.ts` | private    | Converts NestJS `message: string \| string[]` into a non-empty UI message list. |
| `getErrorTitle`   | `src/shared/api/client/api-error.ts` | private    | Reads the NestJS `error` title when present.                                    |
| `classifyStatus`  | `src/shared/api/client/api-error.ts` | private    | Maps HTTP statuses to `ApiErrorKind`.                                           |
