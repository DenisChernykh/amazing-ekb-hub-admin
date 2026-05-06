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

## Session Entity

| Helper                      | Location                                  | Visibility | Contract                                                      |
| --------------------------- | ----------------------------------------- | ---------- | ------------------------------------------------------------- |
| `getCurrentSessionQueryKey` | `src/entities/session/api/session-api.ts` | exported   | Returns the React Query key for the current backend session.  |
| `invalidateCurrentSession`  | `src/entities/session/api/session-api.ts` | exported   | Invalidates the current session query after login or refresh. |
| `removeCurrentSession`      | `src/entities/session/api/session-api.ts` | exported   | Removes the current session query after logout.               |
| `getRoleMeta`               | `src/entities/session/ui/role-meta.ts`    | exported   | Maps backend `Role` to localized Ant Design tag metadata.     |

## Place Entity

| Helper                        | Location                                       | Visibility | Contract                                                                                 |
| ----------------------------- | ---------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `PLACE_CATEGORY_VALUES`       | `src/entities/place/model/place-categories.ts` | exported   | Provides backend place categories in a stable order for UI controls.                     |
| `useCreatePlaceMutation`      | `src/entities/place/model/place-mutations.ts`  | exported   | Creates a place through admin API and invalidates all admin places list query variants.  |
| `invalidatePlacesListQueries` | `src/entities/place/model/place-mutations.ts`  | exported   | Invalidates admin places list cache after admin place mutations.                         |
| `usePlacesListQuery`          | `src/entities/place/model/place-hooks.ts`      | exported   | Loads the admin places list with retry disabled, including hidden places when requested. |
| `useAdminPlaceDetailQuery`    | `src/entities/place/model/place-hooks.ts`      | exported   | Loads admin place detail independently of public visibility.                             |
| `getPlaceCategoryOptions`     | `src/entities/place/ui/place-meta.ts`          | exported   | Maps backend place categories to localized Ant Design select options.                    |
| `getPlaceCategoryMeta`        | `src/entities/place/ui/place-meta.ts`          | exported   | Maps backend `PlaceCategory` to localized Ant Design tag metadata.                       |
| `getPlaceStatusMeta`          | `src/entities/place/ui/place-meta.ts`          | exported   | Maps backend `PlaceStatus` to localized Ant Design tag metadata.                         |

## Auth UI

| Helper            | Location                                          | Visibility | Contract                                                                                                                                         |
| ----------------- | ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getRedirectPath` | `src/widgets/auth-login/ui/auth-login-screen.tsx` | private    | Converts React Router login state into a safe post-login redirect path. Promote to an auth routing helper if another login-like screen needs it. |

## Places List Widget

| Helper                              | Location                                              | Visibility | Contract                                                                                        |
| ----------------------------------- | ----------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `getSelectedNavigationKey`          | `src/widgets/admin-shell/model/navigation.ts`         | exported   | Maps the current pathname, including nested section routes, to the selected admin sidebar item. |
| `setDefaultAwareParam`              | `src/widgets/places-list/model/pagination.ts`         | private    | Writes pagination search params and removes values equal to defaults.                           |
| `getPlacesListPaginationFromSearch` | `src/widgets/places-list/model/pagination.ts`         | exported   | Reads `page` and `pageSize` from URL search params with safe defaults.                          |
| `getPlacesListStatusFromValue`      | `src/widgets/places-list/model/pagination.ts`         | exported   | Normalizes raw UI/URL status values; only `active` and `hidden` become backend filters.         |
| `getPlacesListStatusFromSearch`     | `src/widgets/places-list/model/pagination.ts`         | exported   | Reads admin status filter from URL search params; missing/invalid means all statuses.           |
| `buildPlacesListPaginationSearch`   | `src/widgets/places-list/model/pagination.ts`         | exported   | Builds default-aware URL search params after changing list pagination.                          |
| `buildPlacesListStatusSearch`       | `src/widgets/places-list/model/pagination.ts`         | exported   | Builds URL search params after changing status filter and resets the page to default.           |
| `placesTableColumns`                | `src/widgets/places-list/ui/places-table-columns.tsx` | exported   | Defines read-only Ant Design table columns for `PlaceSummary` rows with admin detail links.     |

## API Error Internals

| Helper            | Location                             | Visibility | Contract                                                                        |
| ----------------- | ------------------------------------ | ---------- | ------------------------------------------------------------------------------- |
| `isRecord`        | `src/shared/api/client/api-error.ts` | private    | Narrows unknown values to object records before reading NestJS error fields.    |
| `toNestErrorBody` | `src/shared/api/client/api-error.ts` | private    | Treats object-like response data as a possible NestJS error body.               |
| `getMessages`     | `src/shared/api/client/api-error.ts` | private    | Converts NestJS `message: string \| string[]` into a non-empty UI message list. |
| `getErrorTitle`   | `src/shared/api/client/api-error.ts` | private    | Reads the NestJS `error` title when present.                                    |
| `classifyStatus`  | `src/shared/api/client/api-error.ts` | private    | Maps HTTP statuses to `ApiErrorKind`.                                           |
