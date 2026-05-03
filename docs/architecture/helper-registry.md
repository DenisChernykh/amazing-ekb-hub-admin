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

## Session Entity

| Helper                      | Location                                  | Visibility | Contract                                                      |
| --------------------------- | ----------------------------------------- | ---------- | ------------------------------------------------------------- |
| `getCurrentSessionQueryKey` | `src/entities/session/api/session-api.ts` | exported   | Returns the React Query key for the current backend session.  |
| `invalidateCurrentSession`  | `src/entities/session/api/session-api.ts` | exported   | Invalidates the current session query after login or refresh. |
| `removeCurrentSession`      | `src/entities/session/api/session-api.ts` | exported   | Removes the current session query after logout.               |
| `getRoleMeta`               | `src/entities/session/ui/role-meta.ts`    | exported   | Maps backend `Role` to localized Ant Design tag metadata.     |

## Auth UI

| Helper            | Location                                          | Visibility | Contract                                                                                                                                         |
| ----------------- | ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getRedirectPath` | `src/widgets/auth-login/ui/auth-login-screen.tsx` | private    | Converts React Router login state into a safe post-login redirect path. Promote to an auth routing helper if another login-like screen needs it. |

## API Error Internals

| Helper            | Location                             | Visibility | Contract                                                                        |
| ----------------- | ------------------------------------ | ---------- | ------------------------------------------------------------------------------- |
| `isRecord`        | `src/shared/api/client/api-error.ts` | private    | Narrows unknown values to object records before reading NestJS error fields.    |
| `toNestErrorBody` | `src/shared/api/client/api-error.ts` | private    | Treats object-like response data as a possible NestJS error body.               |
| `getMessages`     | `src/shared/api/client/api-error.ts` | private    | Converts NestJS `message: string \| string[]` into a non-empty UI message list. |
| `getErrorTitle`   | `src/shared/api/client/api-error.ts` | private    | Reads the NestJS `error` title when present.                                    |
| `classifyStatus`  | `src/shared/api/client/api-error.ts` | private    | Maps HTTP statuses to `ApiErrorKind`.                                           |
