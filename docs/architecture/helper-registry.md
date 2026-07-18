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
| `getApiBaseUrl`     | `src/shared/api/client/api-base-url.ts`  | exported   | Returns the shared backend API base URL for Axios and browser APIs such as `EventSource`.                                      |
| `buildApiUrl`       | `src/shared/api/client/api-base-url.ts`  | exported   | Builds backend API URLs from the shared base URL and a relative path.                                                          |
| `apiMutator`        | `src/shared/api/client/orval-mutator.ts` | exported   | Orval custom mutator that sends generated requests through the shared Axios client.                                            |
| `shouldSkipRefresh` | `src/shared/api/client/api-client.ts`    | private    | Detects auth endpoints that must not trigger refresh retry. Promote only if another transport needs the same auth-loop rule.   |
| `requestRefresh`    | `src/shared/api/client/api-client.ts`    | private    | Shares one in-flight refresh request between concurrent 401 responses. Keep transport-local unless another API client appears. |

## Shared Number Helpers

| Helper                 | Location                                          | Visibility | Contract                                                                        |
| ---------------------- | ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `parsePositiveInteger` | `src/shared/lib/number/parse-positive-integer.ts` | exported   | Parses positive integer URL/form values and returns a caller-provided fallback. |

## Shared Type Helpers

| Helper     | Location                           | Visibility | Contract                                                                     |
| ---------- | ---------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `isOneOf`  | `src/shared/lib/type/is-one-of.ts` | exported   | Narrows unknown string values through a readonly literal allowlist.          |
| `isRecord` | `src/shared/lib/type/is-record.ts` | exported   | Narrows unknown non-array objects before safely reading string-keyed fields. |

## Shared Slug Helpers

| Helper        | Location                      | Visibility | Contract                                                                |
| ------------- | ----------------------------- | ---------- | ----------------------------------------------------------------------- |
| `isValidSlug` | `src/shared/lib/slug/slug.ts` | exported   | Checks lowercase public slugs with digits and single hyphen separators. |

## Shared URL Helpers

| Helper                      | Location                         | Visibility | Contract                                                                  |
| --------------------------- | -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `isSafeHttpUrl`             | `src/shared/lib/url/safe-url.ts` | exported   | Checks that a URL is an absolute `http` or `https` URL.                   |
| `getHttpUrlValidationError` | `src/shared/lib/url/safe-url.ts` | exported   | Returns the shared local validation message for unsafe `http/https` URLs. |
| `normalizeHttpUrl`          | `src/shared/lib/url/safe-url.ts` | exported   | Trims safe `http/https` URLs and throws before unsafe API payloads.       |

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

| Helper                      | Location                                      | Visibility | Contract                                                            |
| --------------------------- | --------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| `getCurrentSessionQueryKey` | `src/entities/session/api/session-api.ts`     | exported   | Returns the React Query key for the current backend session.        |
| `invalidateCurrentSession`  | `src/entities/session/api/session-api.ts`     | exported   | Invalidates the current session query after login or refresh.       |
| `removeCurrentSession`      | `src/entities/session/api/session-api.ts`     | exported   | Removes the current session query after logout.                     |
| `useCurrentSessionQuery`    | `src/entities/session/model/session-hooks.ts` | exported   | Loads the current backend session with auth-guard retry disabled.   |
| `useLoginSession`           | `src/entities/session/model/session-hooks.ts` | exported   | Logs in through auth API and invalidates the current session query. |
| `useLogoutSession`          | `src/entities/session/model/session-hooks.ts` | exported   | Logs out through auth API and removes the current session query.    |
| `getRoleMeta`               | `src/entities/session/ui/role-meta.ts`        | exported   | Maps backend `Role` to localized Ant Design tag metadata.           |

## Category Entity

| Helper                      | Location                                            | Visibility | Contract                                                                                |
| --------------------------- | --------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| `usePlaceCategoriesQuery`   | `src/entities/category/model/category-hooks.ts`     | exported   | Loads the admin place category list through the `/admin/categories` endpoint.           |
| `useCreateCategoryMutation` | `src/entities/category/model/category-mutations.ts` | exported   | Creates a place category and invalidates the admin category list cache.                 |
| `useUpdateCategoryMutation` | `src/entities/category/model/category-mutations.ts` | exported   | Updates a place category and invalidates category plus admin places list caches.        |
| `useDeleteCategoryMutation` | `src/entities/category/model/category-mutations.ts` | exported   | Deletes an unused place category and invalidates the admin category list cache.         |
| `invalidateCategoryQueries` | `src/entities/category/model/category-mutations.ts` | exported   | Invalidates the admin category list cache after category mutations.                     |
| `formatCategoryDateTime`    | `src/entities/category/ui/category-meta.ts`         | exported   | Formats category datetime strings for compact admin tables without timezone day shifts. |

## Place Entity

| Helper                             | Location                                      | Visibility | Contract                                                                                        |
| ---------------------------------- | --------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `getPlaceStatusFromValue`          | `src/entities/place/model/place-status.ts`    | exported   | Normalizes raw UI/URL values to supported backend place statuses.                               |
| `useCreatePlaceMutation`           | `src/entities/place/model/place-mutations.ts` | exported   | Creates a place through admin API and invalidates all admin places list query variants.         |
| `useUpdatePlaceMutation`           | `src/entities/place/model/place-mutations.ts` | exported   | Updates place fields through admin API and invalidates admin places list/detail caches.         |
| `useUpdatePlaceStatusMutation`     | `src/entities/place/model/place-mutations.ts` | exported   | Updates place publication status and invalidates admin places list/detail caches.               |
| `useUploadPlaceCoverPhotoMutation` | `src/entities/place/model/place-mutations.ts` | exported   | Uploads/replaces a place cover photo and invalidates admin places list/detail caches.           |
| `useSetPinnedMaterialMutation`     | `src/entities/place/model/place-mutations.ts` | exported   | Sets a place pinned material through admin API and invalidates admin place detail cache.        |
| `useClearPinnedMaterialMutation`   | `src/entities/place/model/place-mutations.ts` | exported   | Clears a place pinned material through admin API and invalidates admin place detail cache.      |
| `invalidatePlacesListQueries`      | `src/entities/place/model/place-mutations.ts` | exported   | Invalidates admin places list cache after admin place mutations.                                |
| `invalidateAdminPlaceDetailQuery`  | `src/entities/place/model/place-mutations.ts` | exported   | Invalidates one admin place detail cache after admin place mutations.                           |
| `usePlacesListQuery`               | `src/entities/place/model/place-hooks.ts`     | exported   | Loads the admin places list through the admin endpoint, including hidden places when requested. |
| `useAdminPlaceDetailQuery`         | `src/entities/place/model/place-hooks.ts`     | exported   | Loads admin place detail independently of public visibility.                                    |
| `getPlaceCategoryOptions`          | `src/entities/place/ui/place-meta.ts`         | exported   | Maps loaded backend category objects to Ant Design select options by `category.id`.             |
| `getPlaceCategoryMeta`             | `src/entities/place/ui/place-meta.ts`         | exported   | Maps backend `PlaceCategory` objects to title/color tag metadata from server fields.            |
| `getPlaceStatusMeta`               | `src/entities/place/ui/place-meta.ts`         | exported   | Maps backend `PlaceStatus` to localized Ant Design tag metadata.                                |

## Material Entity

| Helper                                 | Location                                                | Visibility | Contract                                                                                            |
| -------------------------------------- | ------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `usePlaceMaterialsListQuery`           | `src/entities/material/model/material-hooks.ts`         | exported   | Loads place materials through the admin bounded materials read endpoint.                            |
| `useMaterialLibraryQuery`              | `src/entities/material/model/material-library-hooks.ts` | exported   | Loads the admin material library through the admin `/admin/materials` endpoint.                     |
| `useCreatePlaceMaterialMutation`       | `src/entities/material/model/material-mutations.ts`     | exported   | Creates place material through admin API and invalidates bounded materials list plus admin detail.  |
| `useUpdateMaterialMutation`            | `src/entities/material/model/material-mutations.ts`     | exported   | Updates material through admin API and invalidates bounded materials list plus admin detail.        |
| `useUpdateMaterialAdminStatusMutation` | `src/entities/material/model/material-mutations.ts`     | exported   | Updates material library review status and invalidates all material library query variants.         |
| `useLinkPlaceMaterialMutation`         | `src/entities/material/model/material-mutations.ts`     | exported   | Links an existing library material to a place and invalidates place detail/material/library caches. |
| `useHidePlaceMaterialLinkMutation`     | `src/entities/material/model/material-mutations.ts`     | exported   | Hides an active place-material link and invalidates place detail/material/library caches.           |
| `invalidatePlaceMaterialsListQuery`    | `src/entities/material/model/material-mutations.ts`     | exported   | Invalidates one bounded admin materials list after material mutations.                              |
| `invalidateMaterialLibraryQueries`     | `src/entities/material/model/material-mutations.ts`     | exported   | Invalidates all admin material library list query variants after review status mutations.           |
| `isSafeMaterialUrl`                    | `src/entities/material/model/material-url.ts`           | exported   | Checks that material links are absolute `http` or `https` URLs before rendering or API payloads.    |
| `getMaterialUrlValidationError`        | `src/entities/material/model/material-url.ts`           | exported   | Returns the local material URL validation message while leaving empty values to required rules.     |
| `normalizeMaterialUrl`                 | `src/entities/material/model/material-url.ts`           | exported   | Trims material URLs and rejects non-`http/https` payload values before API submission.              |
| `MATERIAL_PLATFORM_VALUES`             | `src/entities/material/ui/material-meta.ts`             | exported   | Provides backend material platforms in a stable order for UI controls.                              |
| `MATERIAL_TYPE_VALUES`                 | `src/entities/material/ui/material-meta.ts`             | exported   | Provides backend material types in a stable order for UI controls.                                  |
| `MATERIAL_ADMIN_STATUS_VALUES`         | `src/entities/material/ui/material-meta.ts`             | exported   | Provides backend material review statuses in a stable order for UI controls.                        |
| `getMaterialPlatformMeta`              | `src/entities/material/ui/material-meta.ts`             | exported   | Maps backend `Platform` to localized Ant Design tag metadata.                                       |
| `getMaterialTypeMeta`                  | `src/entities/material/ui/material-meta.ts`             | exported   | Maps backend `MaterialType` to localized Ant Design tag metadata.                                   |
| `getMaterialAdminStatusMeta`           | `src/entities/material/ui/material-meta.ts`             | exported   | Maps backend `MaterialAdminStatus` to localized Ant Design tag metadata.                            |
| `getMaterialLinkedMeta`                | `src/entities/material/ui/material-meta.ts`             | exported   | Maps material library linked flag to localized Ant Design tag metadata.                             |
| `getMaterialPlatformOptions`           | `src/entities/material/ui/material-meta.ts`             | exported   | Maps backend platforms to localized Ant Design select options.                                      |
| `getMaterialTypeOptions`               | `src/entities/material/ui/material-meta.ts`             | exported   | Maps backend material types to localized Ant Design select options.                                 |
| `getMaterialAdminStatusOptions`        | `src/entities/material/ui/material-meta.ts`             | exported   | Maps backend material review statuses to localized Ant Design select options.                       |
| `formatMaterialDuration`               | `src/entities/material/ui/material-meta.ts`             | exported   | Formats nullable material duration as `m:ss`, `h:mm:ss`, or `—` for list/detail UI.                 |
| `formatMaterialPublishedDate`          | `src/entities/material/ui/material-meta.ts`             | exported   | Formats material publication date from source ISO date part without UTC day shifts.                 |
| `formatMaterialMediaKind`              | `src/entities/material/ui/material-meta.ts`             | exported   | Formats nullable importer media kind for material library table cells.                              |
| `getMaterialLibraryPreviewText`        | `src/entities/material/ui/material-meta.ts`             | exported   | Picks excerpt/title/text fallback for material library table and selector previews.                 |
| `getMaterialLibrarySourceTitle`        | `src/entities/material/ui/material-meta.ts`             | exported   | Picks content source display name or manual-material fallback for library UI.                       |
| `getPublicMaterialTitleText`           | `src/entities/material/ui/material-meta.ts`             | exported   | Picks title or imported-material fallback for public material admin UI.                             |
| `getSafeMaterialHref`                  | `src/entities/material/ui/material-meta.ts`             | exported   | Returns safe `http/https` href values or `null` before rendering material/source/media links.       |
| `MaterialLibrarySourceCell`            | `src/entities/material/ui/material-library-cells.tsx`   | exported   | Renders a material library source title as a safe link plus platform tag.                           |
| `MaterialLibraryPreviewCell`           | `src/entities/material/ui/material-library-cells.tsx`   | exported   | Renders material library preview text either as plain text/action link or as the safe text link.    |
| `MaterialLibraryMediaCell`             | `src/entities/material/ui/material-library-cells.tsx`   | exported   | Renders importer media kind with an optional safe media-preview link.                               |
| `MaterialLibraryAdminStatusTag`        | `src/entities/material/ui/material-library-cells.tsx`   | exported   | Renders localized material library review status tags.                                              |
| `MaterialLibraryLinkedTag`             | `src/entities/material/ui/material-library-cells.tsx`   | exported   | Renders localized material library linked/unlinked tags.                                            |
| `PlaceMaterialsPanel`                  | `src/widgets/place-detail/ui/place-materials-panel.tsx` | exported   | Renders bounded materials table on admin place detail with create/edit/link/hide actions.           |
| `PlaceMaterialsTable`                  | `src/widgets/place-detail/ui/place-materials-table.tsx` | exported   | Renders the bounded materials table without owning query, drawer, or mutation callback state.       |

## Content Source Entity

| Helper                                 | Location                                                        | Visibility | Contract                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `useContentSourcesQuery`               | `src/entities/content-source/model/content-source-hooks.ts`     | exported   | Loads admin content sources through the `/admin/content-sources` endpoint.                                       |
| `useCreateContentSourceMutation`       | `src/entities/content-source/model/content-source-mutations.ts` | exported   | Creates a content source and invalidates all content source list query variants.                                 |
| `useUpdateContentSourceMutation`       | `src/entities/content-source/model/content-source-mutations.ts` | exported   | Updates editable source fields and invalidates content source list plus material library query variants.         |
| `useUpdateContentSourceStatusMutation` | `src/entities/content-source/model/content-source-mutations.ts` | exported   | Enables/disables a content source and invalidates all content source list query variants.                        |
| `useImportTelegramSourceMutation`      | `src/entities/content-source/model/content-source-mutations.ts` | exported   | Starts one-click Telegram import, syncs returned run into cache, and invalidates sources/import/material caches. |
| `invalidateContentSourceQueries`       | `src/entities/content-source/model/content-source-mutations.ts` | exported   | Invalidates all admin content source list query variants.                                                        |
| `CONTENT_SOURCE_PLATFORM_VALUES`       | `src/entities/content-source/ui/content-source-meta.ts`         | exported   | Provides backend content source platforms in a stable order for UI controls.                                     |
| `CONTENT_SOURCE_STATUS_VALUES`         | `src/entities/content-source/ui/content-source-meta.ts`         | exported   | Provides backend content source statuses in a stable order for UI controls.                                      |
| `getContentSourcePlatformMeta`         | `src/entities/content-source/ui/content-source-meta.ts`         | exported   | Maps backend `ContentSourcePlatform` to localized Ant Design tag metadata.                                       |
| `getContentSourceStatusMeta`           | `src/entities/content-source/ui/content-source-meta.ts`         | exported   | Maps backend `ContentSourceStatus` to localized Ant Design tag metadata.                                         |
| `getContentSourcePlatformOptions`      | `src/entities/content-source/ui/content-source-meta.ts`         | exported   | Maps backend content source platforms to localized Ant Design select options.                                    |
| `getContentSourceStatusOptions`        | `src/entities/content-source/ui/content-source-meta.ts`         | exported   | Maps backend content source statuses to localized Ant Design select options.                                     |
| `formatContentSourceDateTime`          | `src/entities/content-source/ui/content-source-meta.ts`         | exported   | Formats nullable source datetime values for compact admin tables.                                                |

## Import Run Entity

| Helper                                           | Location                                                       | Visibility | Contract                                                                                                        |
| ------------------------------------------------ | -------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `useImportRunsQuery`                             | `src/entities/import-run/model/import-run-hooks.ts`            | exported   | Loads admin import run diagnostics through the `/admin/import-runs` endpoint.                                   |
| `isActiveImportRunStatus`                        | `src/entities/import-run/model/import-run-cache.ts`            | exported   | Detects `queued/running` import statuses that should block a repeated import action.                            |
| `isTerminalImportRunStatus`                      | `src/entities/import-run/model/import-run-cache.ts`            | exported   | Detects `completed/failed` statuses that should close realtime subscriptions.                                   |
| `getActiveImportRunForSource`                    | `src/entities/import-run/model/import-run-cache.ts`            | exported   | Picks the newest active import run for one content source from a newest-first import run list.                  |
| `upsertImportRunInList`                          | `src/entities/import-run/model/import-run-cache.ts`            | exported   | Adds or replaces an import run inside an `ImportRunListResponse` while preserving newest-first behavior.        |
| `syncImportRunQueryCache`                        | `src/entities/import-run/model/import-run-cache.ts`            | exported   | Syncs all mounted import-run list query caches with a streamed or returned import run snapshot.                 |
| `invalidateImportRunQueries`                     | `src/entities/import-run/model/import-run-cache.ts`            | exported   | Invalidates all admin import run list query variants.                                                           |
| `invalidateImportRunDependencyQueries`           | `src/entities/import-run/model/import-run-cache.ts`            | exported   | Invalidates import-run, content-source, and material-library caches after import completion changes.            |
| `getImportRunFromQueryCache`                     | `src/entities/import-run/model/import-run-cache.ts`            | exported   | Finds one import run snapshot in mounted import-run query caches by id.                                         |
| `parseImportRunEventData`                        | `src/entities/import-run/model/import-run-events-parser.ts`    | exported   | Parses one SSE payload as `ImportRun` through generated Zod contract.                                           |
| `IMPORT_RUN_UPDATED_EVENT`                       | `src/entities/import-run/model/import-run-events-transport.ts` | exported   | Defines the backend SSE event name carrying successful import run updates.                                      |
| `ImportRunEventsHandlers`                        | `src/entities/import-run/model/import-run-events-transport.ts` | exported   | Describes raw transport callbacks for import-run SSE updates and errors.                                        |
| `ImportRunEventsSubscription`                    | `src/entities/import-run/model/import-run-events-transport.ts` | exported   | Describes the cleanup handle returned by the import-run SSE transport.                                          |
| `subscribeToImportRunEvents`                     | `src/entities/import-run/model/import-run-events-transport.ts` | exported   | Opens native `EventSource` for one import run without parsing payloads or touching React Query.                 |
| `IMPORT_RUN_EVENTS_FALLBACK_REFETCH_INTERVAL_MS` | `src/entities/import-run/model/import-run-events.ts`           | exported   | Defines the fallback durable-refetch interval while SSE is unavailable or failed.                               |
| `ImportRunEventsOptions`                         | `src/entities/import-run/model/import-run-events.ts`           | exported   | Describes options for enabling one import-run SSE subscription.                                                 |
| `ImportRunEventsState`                           | `src/entities/import-run/model/import-run-events.ts`           | exported   | Describes runtime state returned by the SSE subscription hook.                                                  |
| `useImportRunEvents`                             | `src/entities/import-run/model/import-run-events.ts`           | exported   | Subscribes to `GET /admin/import-runs/{runId}/events`, updates React Query caches, and falls back to refetches. |
| `getImportRunStatusMeta`                         | `src/entities/import-run/ui/import-run-meta.ts`                | exported   | Maps backend `ImportRunStatus` to localized Ant Design tag metadata.                                            |
| `formatImportRunCounts`                          | `src/entities/import-run/ui/import-run-meta.ts`                | exported   | Formats import run counters in a stable display order.                                                          |
| `formatImportRunDateTime`                        | `src/entities/import-run/ui/import-run-meta.ts`                | exported   | Formats nullable import run datetime values for compact admin tables.                                           |

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

## Category Form Feature

| Helper                           | Location                                                         | Visibility | Contract                                                                                        |
| -------------------------------- | ---------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `CategoryFormValues`             | `src/features/category/form/model/category-form.ts`              | exported   | Defines create/edit category form values before conversion to generated API payloads.           |
| `CategoryFormChangedField`       | `src/features/category/form/model/category-form.ts`              | exported   | Describes a normalized category field changed in the edit drawer.                               |
| `getCategorySlugValidationError` | `src/features/category/form/model/category-form.ts`              | exported   | Returns the local validation message for optional category slug values.                         |
| `getCategoryFormInitialValues`   | `src/features/category/form/model/category-form.ts`              | exported   | Maps admin category data to edit form initial values.                                           |
| `toCreateCategoryRequest`        | `src/features/category/form/model/category-form.ts`              | exported   | Normalizes category form values into `POST /admin/categories` payload.                          |
| `toUpdateCategoryRequest`        | `src/features/category/form/model/category-form.ts`              | exported   | Builds a normalized partial `PATCH /admin/categories/{categoryId}` payload from changed fields. |
| `hasCategoryFormChanges`         | `src/features/category/form/model/category-form.ts`              | exported   | Detects whether normalized category form values differ from loaded server values.               |
| `getCategoryFormChangedFields`   | `src/features/category/form/model/category-form.ts`              | exported   | Returns normalized changed category fields for edit drawer chips.                               |
| `CategoryFormFields`             | `src/features/category/form/ui/category-form-fields.tsx`         | exported   | Renders shared Ant Design fields for create/edit category drawers.                              |
| `CategoryFormErrorAlert`         | `src/features/category/form/ui/category-form-error-alert.tsx`    | exported   | Renders normalized create/edit category API errors.                                             |
| `CategoryFormChangedFields`      | `src/features/category/form/ui/category-form-changed-fields.tsx` | exported   | Renders changed field chips for category edit drawer.                                           |
| `CreateCategoryDrawer`           | `src/features/category/create/ui/create-category-drawer.tsx`     | exported   | Creates categories through the entity mutation bridge with dirty-close protection.              |
| `EditCategoryDrawer`             | `src/features/category/edit/ui/edit-category-drawer.tsx`         | exported   | Edits category fields through the entity mutation bridge with dirty diff chips.                 |
| `EditCategoryDrawerActions`      | `src/features/category/edit/ui/edit-category-drawer-actions.tsx` | exported   | Renders edit category drawer actions.                                                           |
| `DeleteCategoryButton`           | `src/features/category/delete/ui/delete-category-button.tsx`     | exported   | Deletes unused categories after confirmation through the entity mutation bridge.                |
| `CategoriesScreen`               | `src/widgets/categories/ui/categories-screen.tsx`                | exported   | Loads admin categories and hosts the category table plus create/edit drawers.                   |

## Place Form Feature

| Helper                           | Location                                                              | Visibility | Contract                                                                                                                                               |
| -------------------------------- | --------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PlaceFormValues`                | `src/features/place/form/model/place-form.ts`                         | exported   | Defines create/edit place form values, including optional `summary`/`tags`, before conversion to generated API payloads.                               |
| `getPlaceSlugValidationError`    | `src/features/place/form/model/place-form.ts`                         | exported   | Returns the local validation message for optional place slug values.                                                                                   |
| `getPlaceFormInitialValues`      | `src/features/place/form/model/place-form.ts`                         | exported   | Maps admin `PlaceDetail` to form initial values.                                                                                                       |
| `toCreatePlaceRequest`           | `src/features/place/form/model/place-form.ts`                         | exported   | Normalizes form values into `POST /admin/places` payload, preserving empty optional `summary`/`tags` as `''` and `[]`.                                 |
| `toUpdatePlaceRequest`           | `src/features/place/form/model/place-form.ts`                         | exported   | Builds a normalized partial `PATCH /admin/places/{placeId}` payload from changed fields only, including explicit clears for optional `summary`/`tags`. |
| `hasPlaceFormChanges`            | `src/features/place/form/model/place-form.ts`                         | exported   | Detects whether normalized form values differ from the loaded server values.                                                                           |
| `PlaceFormErrorAlert`            | `src/features/place/form/ui/place-form-error-alert.tsx`               | exported   | Renders normalized create/edit place API errors without parsing backend field names.                                                                   |
| `PlaceFormFields`                | `src/features/place/form/ui/place-form-fields.tsx`                    | exported   | Renders shared Ant Design fields for create/edit place forms.                                                                                          |
| `EditPlaceForm`                  | `src/features/place/edit/ui/edit-place-form.tsx`                      | exported   | Edits place fields, tracks dirty state, and submits partial update payloads through the entity.                                                        |
| `CreatePlaceForm`                | `src/features/place/create/ui/create-place-form.tsx`                  | exported   | Creates places using the shared place form fields and create mutation bridge.                                                                          |
| `CreatePlacePartialSuccessAlert` | `src/features/place/create/ui/create-place-partial-success-alert.tsx` | exported   | Renders the partial-success warning after place creation succeeds but cover upload fails.                                                              |
| `PlaceEditScreen`                | `src/widgets/place-edit/ui/place-edit-screen.tsx`                     | exported   | Loads admin detail, hosts edit form, and blocks dirty in-app navigation.                                                                               |

## Place Status Feature

| Helper             | Location                                              | Visibility | Contract                                                                                    |
| ------------------ | ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| `PlaceStatusPanel` | `src/features/place/status/ui/place-status-panel.tsx` | exported   | Renders admin publish/hide controls and submits status changes through the entity mutation. |

## Place Bulk Moderation Feature

| Helper                                        | Location                                                                         | Visibility | Contract                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `bulkModerationReducer`                       | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`              | exported   | Owns in-memory workflow state for bulk place moderation: selection, queue, progress, retry, and undo.  |
| `bulkModerationActions`                       | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`              | exported   | Action creators for local bulk moderation workflow transitions.                                        |
| `BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY` | `src/features/place/bulk-moderation/model/bulk-moderation-draft-storage.ts`      | exported   | Defines the sessionStorage key for bulk moderation draft selection.                                    |
| `BULK_MODERATION_DRAFT_SELECTION_TTL_MS`      | `src/features/place/bulk-moderation/model/bulk-moderation-draft-storage.ts`      | exported   | Defines the 30-minute ttl for bulk moderation draft selection.                                         |
| `BulkModerationDraftSelectionPayload`         | `src/features/place/bulk-moderation/model/bulk-moderation-draft-storage.ts`      | exported   | Describes the versioned draft-selection payload persisted in sessionStorage.                           |
| `saveBulkModerationDraftSelection`            | `src/features/place/bulk-moderation/model/bulk-moderation-draft-storage.ts`      | exported   | Persists selected `id/status/title` snapshots in sessionStorage or clears empty drafts.                |
| `readBulkModerationDraftSelection`            | `src/features/place/bulk-moderation/model/bulk-moderation-draft-storage.ts`      | exported   | Reads a valid draft-selection payload and removes expired, malformed, or unsupported payloads.         |
| `clearBulkModerationDraftSelection`           | `src/features/place/bulk-moderation/model/bulk-moderation-draft-storage.ts`      | exported   | Removes the bulk moderation draft-selection payload from sessionStorage.                               |
| `getRestorableBulkModerationDraftPlaces`      | `src/features/place/bulk-moderation/model/bulk-moderation-draft-storage.ts`      | exported   | Filters a draft selection against the currently loaded places list and returns fresh loaded snapshots. |
| `bulkModerationDraftMiddleware`               | `src/features/place/bulk-moderation/model/bulk-moderation-draft-middleware.ts`   | exported   | Syncs bulk moderation selection changes to sessionStorage and clears drafts before queue execution.    |
| `selectBulkModerationSelectedIds`             | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`              | exported   | Returns selected place ids for Ant Design table row selection.                                         |
| `selectBulkModerationSelectedPlaces`          | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`              | exported   | Returns selected place snapshots in stable selection order.                                            |
| `selectBulkModerationQueueItems`              | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`              | exported   | Returns current operation queue items in stable order.                                                 |
| `selectBulkModerationFailedItems`             | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`              | exported   | Returns failed queue items for retry actions.                                                          |
| `selectBulkModerationSucceededItems`          | `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`              | exported   | Returns succeeded queue items for undo actions.                                                        |
| `BulkModerationDraftRestorePrompt`            | `src/features/place/bulk-moderation/ui/bulk-moderation-draft-restore-prompt.tsx` | exported   | Renders the non-blocking restore/reset prompt for valid draft selection on `/places`.                  |
| `BulkModerationToolbar`                       | `src/features/place/bulk-moderation/ui/bulk-moderation-toolbar.tsx`              | exported   | Renders selected count and bulk publish/hide/reset actions over the places table.                      |
| `BulkModerationProgressDrawer`                | `src/features/place/bulk-moderation/ui/bulk-moderation-progress-drawer.tsx`      | exported   | Renders queue progress, partial errors, retry failed, and undo succeeded actions.                      |

## Place Cover Feature

| Helper                              | Location                                                     | Visibility | Contract                                                                                         |
| ----------------------------------- | ------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `PLACE_COVER_UPLOAD_MAX_SIZE_BYTES` | `src/features/place/cover/model/place-cover-upload.ts`       | exported   | Defines backend-aligned cover photo size limit for UI validation.                                |
| `PLACE_COVER_UPLOAD_MIME_TYPES`     | `src/features/place/cover/model/place-cover-upload.ts`       | exported   | Defines backend-aligned cover photo MIME allowlist.                                              |
| `PLACE_COVER_UPLOAD_ACCEPT`         | `src/features/place/cover/model/place-cover-upload.ts`       | exported   | Formats the cover upload MIME allowlist for Ant Design Upload/input accept.                      |
| `getPlaceCoverUploadError`          | `src/features/place/cover/model/place-cover-upload.ts`       | exported   | Returns a local validation error for unsupported cover upload files, or `null` for valid files.  |
| `PlaceCoverDraftPicker`             | `src/features/place/cover/ui/place-cover-draft-picker.tsx`   | exported   | Renders create-time cover file selection, local validation, preview, and reset before `placeId`. |
| `PlaceCoverPreview`                 | `src/features/place/cover/ui/place-cover-preview.tsx`        | exported   | Renders selected cover preview, current cover image, or empty state.                             |
| `PlaceCoverUploadActions`           | `src/features/place/cover/ui/place-cover-upload-actions.tsx` | exported   | Renders choose/upload/reset controls for the cover upload panel.                                 |
| `PlaceCoverUploadPanel`             | `src/features/place/cover/ui/place-cover-upload-panel.tsx`   | exported   | Renders current cover preview, local file validation, upload submit, and normalized API errors.  |

## Place Pinned Material Feature

| Helper                       | Location                                                                | Visibility | Contract                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `toSetPinnedMaterialRequest` | `src/features/place/pinned-material/model/pinned-material.ts`           | exported   | Builds `PATCH /admin/places/{placeId}/pinned-material` payload or returns `null` for non-assign values.         |
| `PinnedMaterialActions`      | `src/features/place/pinned-material/ui/pinned-material-actions.tsx`     | exported   | Renders submit and clear actions for the pinned material panel.                                                 |
| `PinnedMaterialErrorAlert`   | `src/features/place/pinned-material/ui/pinned-material-error-alert.tsx` | exported   | Renders normalized pinned material mutation errors.                                                             |
| `PinnedMaterialPanel`        | `src/features/place/pinned-material/ui/pinned-material-panel.tsx`       | exported   | Renders current pinned material, set/change selector, and clear action using the loaded bounded materials list. |

## Material Form Feature

| Helper                         | Location                                                         | Visibility | Contract                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `MaterialFormValues`           | `src/features/material/form/model/material-form.ts`              | exported   | Defines create/edit material form values before conversion to generated API payloads.                          |
| `MaterialFormChangedField`     | `src/features/material/form/model/material-form.ts`              | exported   | Describes a normalized changed material field shown as an edit drawer diff chip.                               |
| `isMaterialDurationEnabled`    | `src/features/material/form/model/material-form.ts`              | exported   | Detects whether material duration is applicable for the selected material type.                                |
| `getMaterialFormInitialValues` | `src/features/material/form/model/material-form.ts`              | exported   | Maps admin `Material` to form initial values.                                                                  |
| `toCreateMaterialRequest`      | `src/features/material/form/model/material-form.ts`              | exported   | Normalizes form values into `POST /admin/places/{placeId}/materials` payload with `YYYY-MM-DD` published date. |
| `toUpdateMaterialRequest`      | `src/features/material/form/model/material-form.ts`              | exported   | Builds a normalized partial `PATCH /admin/materials/{materialId}` payload from changed fields only.            |
| `hasMaterialFormChanges`       | `src/features/material/form/model/material-form.ts`              | exported   | Detects whether normalized material form values differ from loaded server values.                              |
| `getMaterialFormChangedFields` | `src/features/material/form/model/material-form.ts`              | exported   | Returns normalized changed field labels for edit drawer chips.                                                 |
| `MaterialFormChangedFields`    | `src/features/material/form/ui/material-form-changed-fields.tsx` | exported   | Renders material edit drawer changed-field chips.                                                              |
| `MaterialFormErrorAlert`       | `src/features/material/form/ui/material-form-error-alert.tsx`    | exported   | Renders normalized create/edit material API errors without parsing backend field names.                        |
| `MaterialFormFields`           | `src/features/material/form/ui/material-form-fields.tsx`         | exported   | Renders shared Ant Design fields for create/edit material forms.                                               |
| `CreateMaterialDrawer`         | `src/features/material/create/ui/create-material-drawer.tsx`     | exported   | Creates place materials in a guarded Ant Design drawer through the entity mutation bridge.                     |
| `EditMaterialDrawerActions`    | `src/features/material/edit/ui/edit-material-drawer-actions.tsx` | exported   | Renders cancel/save actions for the edit material drawer.                                                      |
| `EditMaterialDrawer`           | `src/features/material/edit/ui/edit-material-drawer.tsx`         | exported   | Edits material fields in a guarded Ant Design drawer with dirty diff chips and partial update payloads.        |

## Material Admin Status Feature

| Helper                       | Location                                                                  | Visibility | Contract                                                                     |
| ---------------------------- | ------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `MaterialAdminStatusActions` | `src/features/material/admin-status/ui/material-admin-status-actions.tsx` | exported   | Renders approve/reject/archive review actions for one material library item. |

## Material Link Existing Feature

| Helper                       | Location                                                                   | Visibility | Contract                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `LinkExistingMaterialTable`  | `src/features/material/link-existing/ui/link-existing-material-table.tsx`  | exported   | Renders approved material library rows for the place-linking drawer.                             |
| `LinkExistingMaterialDrawer` | `src/features/material/link-existing/ui/link-existing-material-drawer.tsx` | exported   | Renders approved material selector, excludes active links for the place, and links one material. |

## Content Source Form Feature

| Helper                              | Location                                                                     | Visibility | Contract                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `ContentSourceFormValues`           | `src/features/content-source/form/model/content-source-form.ts`              | exported   | Defines create/edit content source form values before conversion to generated API payloads.                    |
| `ContentSourceFormChangedField`     | `src/features/content-source/form/model/content-source-form.ts`              | exported   | Describes a normalized changed content source field shown as an edit drawer diff chip.                         |
| `getContentSourceFormInitialValues` | `src/features/content-source/form/model/content-source-form.ts`              | exported   | Maps admin `ContentSource` to form initial values.                                                             |
| `toCreateContentSourceRequest`      | `src/features/content-source/form/model/content-source-form.ts`              | exported   | Normalizes form values into `POST /admin/content-sources` payload.                                             |
| `toUpdateContentSourceRequest`      | `src/features/content-source/form/model/content-source-form.ts`              | exported   | Builds a normalized partial `PATCH /admin/content-sources/{sourceId}` payload with explicit null clears.       |
| `hasContentSourceFormChanges`       | `src/features/content-source/form/model/content-source-form.ts`              | exported   | Detects whether normalized content source form values differ from loaded server values.                        |
| `getContentSourceFormChangedFields` | `src/features/content-source/form/model/content-source-form.ts`              | exported   | Returns normalized changed field labels for edit drawer chips.                                                 |
| `ContentSourceFormChangedFields`    | `src/features/content-source/form/ui/content-source-form-changed-fields.tsx` | exported   | Renders content source edit drawer changed-field chips.                                                        |
| `ContentSourceFormErrorAlert`       | `src/features/content-source/form/ui/content-source-form-error-alert.tsx`    | exported   | Renders normalized create/edit content source API errors.                                                      |
| `ContentSourceFormFields`           | `src/features/content-source/form/ui/content-source-form-fields.tsx`         | exported   | Renders shared Ant Design fields for create/edit content source forms.                                         |
| `CreateContentSourceDrawer`         | `src/features/content-source/create/ui/create-content-source-drawer.tsx`     | exported   | Creates content sources in a guarded Ant Design drawer through the entity mutation bridge.                     |
| `EditContentSourceDrawerActions`    | `src/features/content-source/edit/ui/edit-content-source-drawer-actions.tsx` | exported   | Renders cancel/save actions for the edit content source drawer.                                                |
| `EditContentSourceDrawer`           | `src/features/content-source/edit/ui/edit-content-source-drawer.tsx`         | exported   | Edits content source fields in a guarded Ant Design drawer with dirty diff chips.                              |
| `ContentSourceStatusActions`        | `src/features/content-source/status/ui/content-source-status-actions.tsx`    | exported   | Renders enable/disable actions for one content source.                                                         |
| `ImportTelegramSourceButton`        | `src/features/content-source/import/ui/import-telegram-source-button.tsx`    | exported   | Renders one-click Telegram import action, active-run disabled state, counters, and 409 active-import feedback. |

## Material Library Widget

| Helper                                    | Location                                                          | Visibility | Contract                                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `MATERIAL_LIBRARY_MAX_PAGE_SIZE`          | `src/widgets/material-library/model/material-library-filters.ts`  | exported   | Defines backend max `pageSize` accepted by material library URL pagination.                       |
| `getMaterialLibraryLinkedFilterFromValue` | `src/widgets/material-library/model/material-library-filters.ts`  | exported   | Normalizes raw linked filter values from URL or UI controls.                                      |
| `getMaterialLibraryFiltersFromSearch`     | `src/widgets/material-library/model/material-library-filters.ts`  | exported   | Reads material library platform/status/linked filters from URL search params.                     |
| `getMaterialLibraryPaginationFromSearch`  | `src/widgets/material-library/model/material-library-filters.ts`  | exported   | Reads material library `page` and `pageSize` from URL search params.                              |
| `getMaterialLibraryQueryParams`           | `src/widgets/material-library/model/material-library-filters.ts`  | exported   | Converts material library URL filter and pagination state into query params.                      |
| `buildMaterialLibraryFiltersSearch`       | `src/widgets/material-library/model/material-library-filters.ts`  | exported   | Builds next URL search params after changing material library filters and resets page.            |
| `buildMaterialLibraryPaginationSearch`    | `src/widgets/material-library/model/material-library-filters.ts`  | exported   | Builds default-aware URL search params after changing material library pagination.                |
| `MaterialLibraryFilterBar`                | `src/widgets/material-library/ui/material-library-filter-bar.tsx` | exported   | Renders typed URL-driven filters for the material library inbox.                                  |
| `MaterialLibraryTable`                    | `src/widgets/material-library/ui/material-library-table.tsx`      | exported   | Renders the material library inbox table without owning URL/query state.                          |
| `MaterialLibraryInbox`                    | `src/widgets/material-library/ui/material-library-inbox.tsx`      | exported   | Renders the material library inbox table with URL-driven filters, pagination, and review actions. |

## Content Sources Widget

| Helper                              | Location                                                             | Visibility | Contract                                                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `getContentSourceFiltersFromSearch` | `src/widgets/content-sources/model/content-source-filters.ts`        | exported   | Reads content source platform/status filters from URL search params.                                                         |
| `getContentSourceQueryParams`       | `src/widgets/content-sources/model/content-source-filters.ts`        | exported   | Converts content source URL filter state into `/admin/content-sources` query params.                                         |
| `buildContentSourceFiltersSearch`   | `src/widgets/content-sources/model/content-source-filters.ts`        | exported   | Builds next URL search params after changing content source filters.                                                         |
| `ContentSourceFiltersBar`           | `src/widgets/content-sources/ui/content-source-filters-bar.tsx`      | exported   | Renders URL-driven platform/status filters for the content sources table.                                                    |
| `ContentSourcesHeader`              | `src/widgets/content-sources/ui/content-sources-header.tsx`          | exported   | Renders the content sources screen heading and create action.                                                                |
| `ContentSourcesStateLayout`         | `src/widgets/content-sources/ui/content-sources-state-layout.tsx`    | exported   | Renders the shared loading/error shell for content sources screen states.                                                    |
| `ContentSourcesDrawers`             | `src/widgets/content-sources/ui/content-sources-drawers.tsx`         | exported   | Renders the create/edit drawers controlled by the content sources screen.                                                    |
| `getContentSourcesTableColumns`     | `src/widgets/content-sources/ui/content-sources-table-columns.tsx`   | exported   | Builds content source table columns with safe links and row actions.                                                         |
| `ContentSourcesTable`               | `src/widgets/content-sources/ui/content-sources-table.tsx`           | exported   | Renders content source rows, identity metadata, status actions, and active-run-aware import action.                          |
| `ImportRunEventsSubscriptions`      | `src/widgets/content-sources/ui/import-run-events-subscriptions.tsx` | exported   | Mounts active import-run SSE subscriptions without visible UI.                                                               |
| `ImportRunsTable`                   | `src/widgets/content-sources/ui/import-runs-table.tsx`               | exported   | Renders read-only latest import run diagnostics and source display names.                                                    |
| `ContentSourcesScreen`              | `src/widgets/content-sources/ui/content-sources-screen.tsx`          | exported   | Renders content source management, URL-driven filters, source actions, latest import runs, and active-run SSE subscriptions. |

## API Error Internals

| Helper            | Location                             | Visibility | Contract                                                                        |
| ----------------- | ------------------------------------ | ---------- | ------------------------------------------------------------------------------- |
| `isRecord`        | `src/shared/api/client/api-error.ts` | private    | Narrows unknown values to object records before reading NestJS error fields.    |
| `toNestErrorBody` | `src/shared/api/client/api-error.ts` | private    | Treats object-like response data as a possible NestJS error body.               |
| `getMessages`     | `src/shared/api/client/api-error.ts` | private    | Converts NestJS `message: string \| string[]` into a non-empty UI message list. |
| `getErrorTitle`   | `src/shared/api/client/api-error.ts` | private    | Reads the NestJS `error` title when present.                                    |
| `classifyStatus`  | `src/shared/api/client/api-error.ts` | private    | Maps HTTP statuses to `ApiErrorKind`.                                           |
