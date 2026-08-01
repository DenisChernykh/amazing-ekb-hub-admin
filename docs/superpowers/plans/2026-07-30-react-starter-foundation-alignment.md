# React Starter Foundation Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Атомарно привести инфраструктурную основу `admin-codex` к актуальному `react-starter`: единый backend OpenAPI/Orval contract, cookie + CSRF auth, строгие Problem Details errors, React Router Data Mode и активный MSW test transport, сохранив Ant Design и существующие продуктовые сценарии.

**Architecture:** Backend OpenAPI становится единственным transport source of truth. Сгенерированный Orval-код остаётся внутри `shared/api`, а рукописный код использует только curated public API. Axios отвечает за cookie credentials и CSRF, session entity — за единый React Query cache contract, loaders — за доступ к маршрутам до render, а UI отображает только локальные сообщения по стабильным `ProblemCode`. Миграция выполняется без временного refresh-flow, двойных OpenAPI snapshots или параллельных auth guards.

**Tech Stack:** React 19.2, React Router 8.3 Data Mode, TanStack Query 5.101, Axios 1.18, Orval 8.23, Zod 4.4, React Hook Form 7.83, MSW 2.15, Vitest 4.1, Vite 8.1, Ant Design 6.

## Source Pins and Preflight

План составлен по следующим проверенным ревизиям:

- admin base: `origin/stage@ffd3499`;
- admin design commit: `d0fa59e`;
- starter runtime source: `/Users/denischernykh/projects/starters/react-starter@872619e`;
- backend OpenAPI source: `/Users/denischernykh/projects/pet/amazing-ekb-hub/backend-codex@6afe205`.

Перед реализацией не reset-ить и не очищать checkout. Сначала выполнить:

```bash
pwd
git status -sb
git rev-parse HEAD
git rev-parse origin/stage
git worktree list
git -C /Users/denischernykh/projects/starters/react-starter status -sb
git -C /Users/denischernykh/projects/starters/react-starter rev-parse HEAD
git -C /Users/denischernykh/projects/pet/amazing-ekb-hub/backend-codex status -sb
git -C /Users/denischernykh/projects/pet/amazing-ekb-hub/backend-codex rev-parse HEAD
```

Expected:

- работа идёт в `/Users/denischernykh/projects/pet/amazing-ekb-hub/admin-codex`;
- branch — `refactor/react-starter-foundation`;
- design commit присутствует в истории;
- неизвестные изменения сохранены и отдельно отмечены;
- если starter/backend HEAD изменились, сначала сравнить foundation/OpenAPI diff с pins и актуализировать этот план, а не молча переносить новый контракт.

## Global Constraints

- Не менять Ant Design на shadcn и не переписывать продуктовый UI ради визуального совпадения со starter.
- Не менять backend в этой ветке. Backend OpenAPI `docs/api/openapi.json` — source of truth; generated frontend files вручную не редактировать.
- Выполнить один полный cutover: удалить `openapi.yaml`, legacy refresh interceptor, `RequireAuth`, session context и старую NestJS error normalization.
- Не оставлять compatibility re-exports старых generated names или старых auth/error contracts.
- `VITE_API_BASE_URL` означает API origin/root: `/` для same-origin или абсолютный `http(s)` origin без path. Версия API остаётся в generated `/v1/...` paths.
- Все handwritten imports из `generated/**` и `generated-zod/**` заменить импортами из `@/shared/api`.
- Login не требует CSRF. Все остальные `POST`, `PUT`, `PATCH`, `DELETE` получают `X-CSRF-Token`; отсутствующий body становится `{}`.
- Только `AUTHENTICATION_REQUIRED` означает потерю сессии и redirect на login. `AUTHORIZATION_DENIED`, network, protocol и остальные problem responses не маскировать под logout.
- Не показывать пользователю backend `title` или общий `detail`. Field `detail` допускается только для явно allowlisted form pointers; остальной UI использует локальные сообщения по `code`. `requestId` можно показывать для диагностики.
- Сохранить `staleTime: 30_000`; queries повторяют только network и `5xx`, максимум после двух failures; mutations не повторяются; focus refetch выключен.
- Сохранить очистку bulk moderation draft на успешном login, успешном logout и `AUTHENTICATION_REQUIRED`.
- MSW включить глобально для Vitest с `onUnhandledRequest: 'error'`; базовый handlers list остаётся пустым.
- Не переводить все продуктовые unit tests на MSW. Использовать MSW для transport/auth/router integration contracts, а чистые hooks/builders продолжать тестировать через текущие test doubles.
- Сохранить `z.config(ru())`; выровнять `useZodForm` со starter без изменения form UX.
- До создания helper проверить `docs/architecture/helper-registry.md`; новые/перемещённые helpers зарегистрировать в той же задаче.
- Для каждого нового или изменённого exported handwritten TS/TSX API добавить русский TSDoc и в конце проверить `docs/architecture/tsdoc-guidelines.md`.
- Во время задач запускать focused tests и узкие проверки. Полный набор запускать один раз после реализации и review/fix wave.
- Не push-ить ветку, не создавать PR, не merge-ить и не deploy-ить без отдельного запроса пользователя.

---

## Task 1: Align Toolchain and Activate MSW Test Lifecycle

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `pnpm-workspace.yaml`
- Modify: `Dockerfile`
- Modify: `.github/workflows/deploy-production.yml`
- Modify: `src/test/setup.ts`
- Create: `src/test/msw/handlers.ts`
- Create: `src/test/msw/server.ts`
- Create: `src/test/msw/server.test.ts`
- Modify: `src/shared/lib/form/use-zod-form.ts`
- Modify: `src/shared/lib/form/use-zod-form.test.tsx`

**Interfaces:**

- `packageManager`: `pnpm@11.15.1`;
- `engines.node`: `24.18.0`;
- `engines.pnpm`: `11.15.1`;
- `handlers: RequestHandler[]`;
- `server = setupServer(...handlers)`;
- `useZodForm(schema, options?)`, где options необязателен и `z` импортируется только как type.

- [ ] **Step 1: Write the failing MSW foundation test**

Create `src/test/msw/server.test.ts`:

```ts
import { http, HttpResponse } from 'msw'

import { handlers } from './handlers'
import { server } from './server'

describe('MSW test server', () => {
  it('starts with no product handlers and accepts a test-local handler', async () => {
    expect(handlers).toEqual([])
    server.use(
      http.get('http://api.test/v1/health', () =>
        HttpResponse.json({ status: 'ok' }),
      ),
    )

    const response = await fetch('http://api.test/v1/health')

    await expect(response.json()).resolves.toEqual({ status: 'ok' })
  })
})
```

Run:

```bash
pnpm exec vitest run src/test/msw/server.test.ts
```

Expected: FAIL because `handlers.ts` and `server.ts` do not exist.

- [ ] **Step 2: Add the MSW server and global lifecycle**

Create `src/test/msw/handlers.ts`:

```ts
import type { RequestHandler } from 'msw'

/** Базовый пустой набор MSW handlers для тестов админки. */
export const handlers: RequestHandler[] = []
```

Create `src/test/msw/server.ts`:

```ts
import { setupServer } from 'msw/node'

import { handlers } from './handlers'

/** Общий MSW server для transport и router integration tests. */
export const server = setupServer(...handlers)
```

Extend `src/test/setup.ts` without removing Zod locale, `matchMedia` or `ResizeObserver`:

```ts
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { server } from './msw/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
```

Do not add product handlers to `handlers.ts`; every scenario uses `server.use(...)` in its own test.

- [ ] **Step 3: Align runtime and package versions**

Update `package.json` to the starter foundation versions:

```json
{
  "packageManager": "pnpm@11.15.1",
  "engines": {
    "node": "24.18.0",
    "pnpm": "11.15.1"
  }
}
```

Set:

- `react` and `react-dom` to `^19.2.7`;
- `react-router` to `8.3.0`;
- `@tanstack/react-query` and devtools to `^5.101.4`;
- `axios` to `1.18.1`;
- `react-hook-form` to `^7.83.0`;
- `zod` to `^4.4.3`;
- `msw` to `2.15.0`;
- `orval` to `8.23.0`;
- Vite to `^8.1.1`;
- Vitest to `4.1.10`;
- `@types/node` to `^24.13.3`;
- `@types/react` to `^19.2.17`;
- `@types/react-dom` to `^19.2.3`;
- `@vitejs/plugin-react` to `^6.0.3`;
- `@testing-library/jest-dom` to `7.0.0`;
- `@testing-library/react` to `16.3.2`;
- `@testing-library/user-event` to `14.6.1`;
- `jsdom` to `29.1.1`;
- `eslint` to `^10.6.0`;
- `eslint-plugin-jsdoc` to `63.3.1`;
- `eslint-plugin-react-refresh` to `^0.5.3`;
- `globals` to `^17.7.0`;
- `typescript-eslint` to `^8.62.0`;
- `prettier` to `3.9.6`.

Keep admin-only AntD, Redux, Husky, TSDoc, `eslint-config-prettier`, `eslint-plugin-tsdoc` and organize-imports dependencies. Do not add starter-only shadcn/Tailwind/Steiger packages.

Create `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  esbuild: true
  msw: true
```

Run:

```bash
corepack prepare pnpm@11.15.1 --activate
pnpm install
```

Expected:

- `pnpm-lock.yaml` is regenerated by pnpm 11.15.1;
- MSW postinstall and esbuild are explicitly allowed;
- existing AntD, Redux, Husky, TSDoc and project-only dependencies remain.

- [ ] **Step 4: Align Docker and CI runtime pins**

In `Dockerfile` set:

```dockerfile
ARG NODE_VERSION=24.18.0-alpine
ARG PNPM_VERSION=11.15.1
```

In `.github/workflows/deploy-production.yml` set the quality job to pnpm `11.15.1` and Node `24.18.0`. Do not otherwise change deployment ownership or trigger behavior.

- [ ] **Step 5: Align `useZodForm` without changing form policy**

First extend `src/shared/lib/form/use-zod-form.test.tsx` with a case that calls `useZodForm(schema)` without options and proves a valid submit still returns `z.output`.

Expected before implementation: TypeScript FAIL because options is required.

Then update `src/shared/lib/form/use-zod-form.ts`:

```ts
import type { z } from 'zod'

export function useZodForm<TSchema extends z.ZodType>(
  schema: TSchema & ZodFormSchema<TSchema>,
  options?: UseZodFormOptions<TSchema>,
): UseFormReturn<ZodFormInput<TSchema>, unknown, z.output<TSchema>> {
  return useForm<ZodFormInput<TSchema>, unknown, z.output<TSchema>>({
    ...options,
    resolver: zodResolver<ZodFormInput<TSchema>, unknown, z.output<TSchema>>(
      schema,
    ),
  })
}
```

Retain the precise generic return contract and update TSDoc to state that options are optional, while domain forms still own defaults/mode/reset/server behavior.

- [ ] **Step 6: Verify and commit Task 1**

Run:

```bash
pnpm exec vitest run src/test/msw/server.test.ts src/shared/lib/form/use-zod-form.test.tsx src/shared/config/zod-locale.test.ts
pnpm run typecheck
git diff --check
```

Expected: all PASS; typecheck uses the current script until Task 8 changes it.

Commit:

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml Dockerfile .github/workflows/deploy-production.yml src/test src/shared/lib/form/use-zod-form.ts src/shared/lib/form/use-zod-form.test.tsx
git commit -m "build: align starter toolchain and enable msw"
```

---

## Task 2: Cut Over to One OpenAPI Snapshot and Curated API Boundary

This task is intentionally atomic. Do not commit a state where TypeScript client and Zod schemas are generated from different documents, or handwritten code imports generated internals.

**Files:**

- Modify: `scripts/api/sync-openapi.mjs`
- Modify: `scripts/api/openapi-source.test.mjs`
- Modify: `orval.config.ts`
- Modify: `package.json`
- Refresh: `openapi/openapi.json`
- Delete: `openapi.yaml`
- Regenerate: `src/shared/api/generated/**`
- Regenerate: `src/shared/api/generated-zod/**`
- Create: `src/shared/api/index.ts`
- Modify: all handwritten files listed in **Appendix A**

**Interfaces:**

- one snapshot: `openapi/openapi.json`;
- required auth operations: `authLogin`, `authGetCsrfToken`, `authGetMe`, `authLogout`;
- Orval tag-split operation groups: `admin-categories`, `admin-content-sources`, `admin-import-runs`, `admin-materials`, `admin-place-imports`, `admin-places`, `auth`;
- handwritten import boundary: `@/shared/api`.

- [ ] **Step 1: Extend the OpenAPI sync contract test**

Add these required paths to `validOpenApiDocument` in `scripts/api/openapi-source.test.mjs`:

```js
'/v1/auth/csrf': {
  get: { operationId: 'authGetCsrfToken', tags: ['auth'] },
},
'/v1/auth/me': {
  get: { operationId: 'authGetMe', tags: ['auth'] },
},
'/v1/auth/logout': {
  post: { operationId: 'authLogout', tags: ['auth'] },
},
```

Add a table-driven rejection test that removes each of login/csrf/me/logout and expects the exact missing method/path in the error.

Run:

```bash
pnpm exec vitest run scripts/api/openapi-source.test.mjs
```

Expected: FAIL until `requiredOperations` in `sync-openapi.mjs` contains all four operations.

- [ ] **Step 2: Strengthen sync validation**

Update `requiredOperations` in `scripts/api/sync-openapi.mjs` with all four auth operations and retain all product write operations already protected by the script.

Also validate the backend foundation contract before writing:

```js
const requiredProblemCodes = [
  'AUTHENTICATION_REQUIRED',
  'AUTHORIZATION_DENIED',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'DEPENDENCY_UNAVAILABLE',
  'INTERNAL_ERROR',
]
```

Read them from `components.schemas.ProblemResponseDto.properties.code.enum`; reject a snapshot missing any required code. Add a failing test for a missing `VALIDATION_FAILED` code, then make it pass.

This check prevents regenerating the client from the pre-#160 backend error contract.

- [ ] **Step 3: Point both Orval targets at one document**

Replace the dual input constants in `orval.config.ts` with:

```ts
const openApiSnapshotPath = './openapi/openapi.json'
```

Use it for both `amazingEkbHub.input.target` and `amazingEkbHubZod.input.target`. Preserve `clean`, `tags-split`, named parameters, React Query v5 signal support and strict Zod generation.

Change package scripts:

```json
{
  "api:generate": "orval --config orval.config.ts && prettier --write src/shared/api/generated src/shared/api/generated-zod",
  "api:update": "pnpm run api:sync && pnpm run api:generate",
  "api:check": "pnpm run api:generate && git diff --exit-code -- openapi/openapi.json src/shared/api/generated src/shared/api/generated-zod"
}
```

There must be no conditional “not a git worktree” skip.

- [ ] **Step 4: Sync the fixed backend contract and regenerate**

Run:

```bash
OPENAPI_SPEC_SOURCE=/Users/denischernykh/projects/pet/amazing-ekb-hub/backend-codex/docs/api/openapi.json pnpm run api:update
```

Expected:

- `openapi/openapi.json` contains backend `6afe205` contract;
- Orval creates tag-split folders with the current operation IDs;
- Zod generates matching request/response schemas;
- `CurrentUserResponseDto` contains `userId`, `normalizedEmail`, `roleKeys`, `permissions`;
- `LoginResponseDto` contains `csrfToken` and `session`;
- errors contain `VALIDATION_FAILED` on `422` and generic `NOT_FOUND`;
- generated files are formatted by the script.

Delete `openapi.yaml` only after successful generation.

- [ ] **Step 5: Create the curated handwritten API**

Create `src/shared/api/index.ts`. It must:

1. import `@/shared/config/zod-locale` before re-exporting generated Zod schemas;
2. re-export every generated operation/query option/query key used by entities;
3. re-export only generated DTO/parameter/enum types used by handwritten code;
4. alias generated Zod exports to domain-readable schema names;
5. later re-export transport errors and CSRF helpers from Tasks 4–5.

The initial shape is:

```ts
import '@/shared/config/zod-locale'

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
} from './generated/admin-categories/admin-categories'

export {
  adminContentSourcesCreate,
  adminContentSourcesList,
  adminContentSourcesUpdate,
  adminContentSourcesUpdateStatus,
  adminTelegramImportsEnqueue,
} from './generated/admin-content-sources/admin-content-sources'

export {
  adminImportRunsList,
  adminImportRunsStreamEvents,
} from './generated/admin-import-runs/admin-import-runs'

export {
  adminMaterialsList,
  adminMaterialsUpdate,
  adminMaterialsUpdateStatus,
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
} from './generated/admin-place-imports/admin-place-imports'

export {
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
} from './generated/admin-places/admin-places'

export {
  AdminCategoriesCreateBody,
  AdminCategoriesUpdateBody,
} from './generated-zod/admin-categories/admin-categories.zod'
export { AdminContentSourcesCreateBody } from './generated-zod/admin-content-sources/admin-content-sources.zod'
export { AdminImportRunsList200Response } from './generated-zod/admin-import-runs/admin-import-runs.zod'
export { AdminMaterialsUpdateBody } from './generated-zod/admin-materials/admin-materials.zod'
export {
  AdminPlaceImportsGetEvents200Response,
  AdminPlaceImportsStartBody,
} from './generated-zod/admin-place-imports/admin-place-imports.zod'
export {
  AdminPlaceMaterialsCreateBody,
  AdminPlacesCreateBody,
  AdminPlacesUpdateBody,
} from './generated-zod/admin-places/admin-places.zod'
export { AuthLoginBody as authLoginSchema } from './generated-zod/auth/auth.zod'
```

Add explicit named type re-exports from `./generated/model` for the DTO, enum and parameter symbols referenced by Appendix A after regeneration. Do not use `export *` and do not expose generated hooks directly to application UI.

- [ ] **Step 6: Migrate all handwritten generated imports**

For every file in Appendix A:

- change generated operation/type/schema names to current backend names;
- import them from `@/shared/api`;
- keep entity hooks/cache helpers as the application boundary; feature/widget/page UI must not begin calling generated hooks;
- adapt renamed DTO fields, pagination response wrappers and operation parameters from the compiler errors;
- do not add casts or local compatibility DTOs to imitate the old snapshot.

Use the backend operation list in `openapi/openapi.json`, not names inferred from old `openapi.yaml`.

- [ ] **Step 7: Prove there is no dual boundary**

Run:

```bash
rg -n "openapi\\.yaml|apiClientSnapshotPath|validationSnapshotPath" . --glob '!docs/superpowers/**'
rg -n "@/shared/api/generated(-zod)?/" src \
  --glob '!src/shared/api/generated/**' \
  --glob '!src/shared/api/generated-zod/**'
pnpm run typecheck
pnpm run test
pnpm run api:generate
git diff --check
```

Expected:

- first two `rg` commands produce no output;
- TypeScript and tests PASS against only the new backend contract;
- повторная генерация не изменяет уже подготовленные generated outputs.

- [ ] **Step 8: Commit Task 2**

```bash
git add scripts/api orval.config.ts package.json openapi openapi.yaml src/shared/api src/app src/entities src/features src/widgets
git commit -m "refactor(api): adopt backend openapi contract"
pnpm run api:check
```

Expected after commit: `api:check` PASS and leaves the worktree clean.

---

## Task 3: Make API Origin Semantics Explicit and Fix SSE Versioned Paths

**Files:**

- Create: `src/shared/config/env.ts`
- Create: `src/shared/config/env.test.ts`
- Create: `src/shared/config/index.ts`
- Modify: `src/shared/api/client/api-base-url.ts`
- Modify: `src/shared/api/client/api-base-url.test.ts`
- Modify: `src/entities/import-run/model/import-run-events-transport.ts`
- Create: `src/entities/import-run/model/import-run-events-transport.test.ts`
- Modify: `src/entities/place-import/model/place-import-events-transport.ts`
- Create: `src/entities/place-import/model/place-import-events-transport.test.ts`
- Modify: `.env.example`
- Modify: `Dockerfile`
- Modify: `vite.config.ts`
- Modify: `.github/workflows/deploy-production.yml`

**Interfaces:**

- `parsePublicEnv(input): PublicEnv`;
- `publicEnv.VITE_API_BASE_URL`;
- `buildApiUrl(path): string`;
- allowed env values: `/` or absolute `http(s)` origin without pathname/query/hash.

- [ ] **Step 1: Write failing env and URL tests**

Create `src/shared/config/env.test.ts` with this table:

```ts
it.each([
  ['/', '/'],
  ['https://api.example.test', 'https://api.example.test'],
  ['https://api.example.test/', 'https://api.example.test'],
])('accepts API root %s', (input, expected) => {
  expect(parsePublicEnv({ VITE_API_BASE_URL: input })).toEqual({
    VITE_API_BASE_URL: expected,
  })
})

it.each([
  ['/v1'],
  ['api.example.test'],
  ['ftp://api.example.test'],
  ['https://api.example.test/backend'],
  ['https://api.example.test?tenant=1'],
])('rejects non-origin API value %s', (input) => {
  expect(() => parsePublicEnv({ VITE_API_BASE_URL: input })).toThrow()
})
```

Extend `api-base-url.test.ts`:

```ts
expect(buildApiUrl('/v1/auth/me')).toBe('/v1/auth/me')
expect(buildApiUrl('/v1/auth/me', 'https://api.example.test')).toBe(
  'https://api.example.test/v1/auth/me',
)
```

If the current exported function does not accept an injected base for tests, extract a documented pure `joinApiUrl(baseUrl, path)` and let `buildApiUrl` call it with `publicEnv`.

Run:

```bash
pnpm exec vitest run src/shared/config/env.test.ts src/shared/api/client/api-base-url.test.ts
```

Expected: FAIL because env validation and root semantics do not exist.

- [ ] **Step 2: Implement strict public env parsing**

Implement a Zod schema that:

- returns `/` unchanged;
- accepts only `http:` or `https:`;
- rejects username/password, query, hash and pathname other than `/`;
- strips only the trailing slash from absolute origins.

Public contract:

```ts
/** Публичные переменные окружения browser bundle. */
export type PublicEnv = z.infer<typeof publicEnvSchema>

/** Проверяет, что API задан same-origin root или абсолютным HTTP(S) origin. */
export function parsePublicEnv(
  input: Record<string, string | boolean | undefined>,
): PublicEnv

/** Проверенная публичная конфигурация приложения. */
export const publicEnv = parsePublicEnv(import.meta.env)
```

`src/shared/config/index.ts` re-exports only `PublicEnv`, `parsePublicEnv`, `publicEnv`.

- [ ] **Step 3: Implement root-aware URL joining**

`getApiBaseUrl()` must return `publicEnv.VITE_API_BASE_URL`. `buildApiUrl('/v1/...')` must:

- preserve the leading `/` for same-origin `/`;
- produce `https://origin/v1/...` for absolute origin;
- reject a path that does not begin with `/` to prevent accidental version loss.

Do not prepend `/v1` inside this helper; callers own full endpoint paths.

- [ ] **Step 4: Fix both manual SSE paths**

Update:

```ts
buildApiUrl(`/v1/admin/import-runs/${encodeURIComponent(runId)}/events`)
```

and:

```ts
buildApiUrl(
  `/v1/admin/place-imports/${encodeURIComponent(operationId)}/events/stream?${search.toString()}`,
)
```

Tests must assert exact same-origin and absolute-origin URLs, `withCredentials: true`, named event wiring and idempotent `close()`.

- [ ] **Step 5: Update environment defaults and build/deploy validation**

Set:

```dotenv
VITE_API_BASE_URL=/
```

In Docker use:

```dockerfile
ARG VITE_API_BASE_URL=/
```

Keep the Vite dev proxy on `/v1`. In the production workflow retain the non-empty check and add a shell validation that accepts `/` or `http(s)://...` origin and rejects a value containing `/v1`.

- [ ] **Step 6: Verify and commit Task 3**

Run:

```bash
pnpm exec vitest run src/shared/config/env.test.ts src/shared/api/client/api-base-url.test.ts src/entities/import-run/model/import-run-events-transport.test.ts src/entities/place-import/model/place-import-events-transport.test.ts
pnpm run typecheck
git diff --check
```

Expected: all PASS.

Commit:

```bash
git add src/shared/config src/shared/api/client/api-base-url.ts src/shared/api/client/api-base-url.test.ts src/entities/import-run/model/import-run-events-transport.ts src/entities/import-run/model/import-run-events-transport.test.ts src/entities/place-import/model/place-import-events-transport.ts src/entities/place-import/model/place-import-events-transport.test.ts .env.example Dockerfile vite.config.ts .github/workflows/deploy-production.yml
git commit -m "refactor(config): use api origin for versioned paths"
```

---

## Task 4: Replace Refresh-on-401 with Cookie + CSRF Axios Transport

**Files:**

- Create: `src/shared/api/client/csrf-token.ts`
- Create: `src/shared/api/client/csrf-token.test.ts`
- Create: `src/shared/api/client/axios-client.ts`
- Create: `src/shared/api/client/axios-client.test.ts`
- Modify: `src/shared/api/client/orval-mutator.ts`
- Create: `src/shared/api/client/orval-mutator.test.ts`
- Delete: `src/shared/api/client/api-client.ts`
- Delete: `src/shared/api/client/api-client.test.ts`
- Modify: `src/shared/api/index.ts`

**Interfaces:**

- `peekCsrfToken()`;
- `setCsrfToken(token)`;
- `clearCsrfToken()`;
- `getOrFetchCsrfToken(fetcher)`;
- `API_AXIOS_INSTANCE`;
- login exclusion only for exact `/v1/auth/login`.

- [ ] **Step 1: Write failing CSRF cache concurrency tests**

`csrf-token.test.ts` must prove:

1. `peekCsrfToken()` starts `null`;
2. two concurrent `getOrFetchCsrfToken(fetcher)` calls invoke `fetcher` once;
3. `setCsrfToken('login-token')` wins over a late pre-login fetch;
4. `clearCsrfToken()` prevents a late pre-logout fetch from restoring the token;
5. a rejected fetch clears pending state so the next call retries.

Use deferred promises, not timers. Example core assertion:

```ts
const first = getOrFetchCsrfToken(fetcher)
const second = getOrFetchCsrfToken(fetcher)

expect(fetcher).toHaveBeenCalledTimes(1)
resolveToken('fetched-token')
await expect(Promise.all([first, second])).resolves.toEqual([
  'fetched-token',
  'fetched-token',
])
```

Run:

```bash
pnpm exec vitest run src/shared/api/client/csrf-token.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement the in-memory generation-safe token cache**

Port the starter contract exactly:

```ts
let csrfToken: string | null = null
let csrfGeneration = 0

type PendingCsrfToken = {
  generation: number
  promise: Promise<string>
}
```

`setCsrfToken` and `clearCsrfToken` increment generation and clear pending state. A fetch result may persist only when both its generation and pending object still match.

- [ ] **Step 3: Write failing Axios/MSW transport tests**

Use the global MSW server, not Axios adapter mocks. Cover:

- GET sends credentials but no CSRF request/header;
- login POST sends JSON and no CSRF request/header;
- unsafe no-body logout first GETs `/v1/auth/csrf`, then POSTs `/v1/auth/logout` with `{}` and `X-CSRF-Token`;
- parallel unsafe calls share one CSRF fetch;
- cached token avoids a second fetch;
- request headers passed by Orval options survive mutator merge;
- no request is ever made to `/auth/refresh`.

Use exact `/v1` paths and an absolute test origin injected through the Axios instances or test-local env module mock.

Run:

```bash
pnpm exec vitest run src/shared/api/client/axios-client.test.ts src/shared/api/client/orval-mutator.test.ts
```

Expected: FAIL against the legacy refresh client.

- [ ] **Step 4: Implement the Axios client**

Create two credentialed instances with the same root:

```ts
const clientDefaults = {
  baseURL: publicEnv.VITE_API_BASE_URL,
  withCredentials: true,
}

export const API_AXIOS_INSTANCE = axios.create(clientDefaults)
const csrfAxios = axios.create(clientDefaults)
```

The request interceptor:

```ts
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

API_AXIOS_INSTANCE.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase() ?? 'GET'
  if (!unsafeMethods.has(method)) return config

  config.headers.set('Content-Type', 'application/json')
  if (config.data === undefined) config.data = {}
  if (config.url === '/v1/auth/login') return config

  config.headers.set('X-CSRF-Token', await getOrFetchCsrfToken(fetchCsrfToken))
  return config
})
```

Validate `/v1/auth/csrf` response with a local Zod schema `{ csrfToken: z.string().min(1) }`.

Delete all `isAuthRefreshRetry`, `refreshPromise`, `shouldSkipRefresh`, `requestRefresh` and `/auth/refresh` logic.

- [ ] **Step 5: Switch the Orval mutator transport**

Import `API_AXIOS_INSTANCE` from `axios-client.ts`. Preserve config/options header merge and operational health `503` behavior. Typed error normalization is implemented in Task 5; until then, retain a direct call to the current normalizer only inside `orval-mutator.ts`.

Re-export `clearCsrfToken`, `peekCsrfToken`, `setCsrfToken` from `src/shared/api/index.ts`. Keep `getOrFetchCsrfToken` transport-internal.

- [ ] **Step 6: Verify removal of refresh behavior and commit**

Run:

```bash
rg -n "auth/refresh|isAuthRefreshRetry|refreshPromise|shouldSkipRefresh|requestRefresh" src
pnpm exec vitest run src/shared/api/client/csrf-token.test.ts src/shared/api/client/axios-client.test.ts src/shared/api/client/orval-mutator.test.ts
pnpm run typecheck
git diff --check
```

Expected:

- `rg` has no output;
- focused tests and typecheck PASS.

Commit:

```bash
git add src/shared/api
git commit -m "refactor(auth): adopt csrf cookie transport"
```

---

## Task 5: Introduce Strict Problem Details Errors and Safe UI Presentation

**Files:**

- Create: `src/shared/api/client/api-errors.ts`
- Create: `src/shared/api/client/api-errors.test.ts`
- Delete: `src/shared/api/client/api-error.ts`
- Delete: `src/shared/api/client/api-error.test.ts`
- Modify: `src/shared/api/client/orval-mutator.ts`
- Modify: `src/shared/api/client/orval-mutator.test.ts`
- Create: `src/shared/api/presentation/api-error-presentation.ts`
- Create: `src/shared/api/presentation/api-error-presentation.test.ts`
- Modify: `src/shared/api/index.ts`
- Modify: `src/app/query-client.ts`
- Create: `src/app/query-client.test.ts`
- Modify: `src/shared/ui/screen-state/screen-api-error-state.tsx`
- Modify: `src/shared/ui/screen-state/screen-state.test.tsx`
- Modify production consumers:
  - `src/entities/category/model/category-hooks.ts`
  - `src/entities/category/model/category-mutations.ts`
  - `src/entities/content-source/model/content-source-hooks.ts`
  - `src/entities/content-source/model/content-source-mutations.ts`
  - `src/entities/import-run/model/import-run-hooks.ts`
  - `src/entities/material/model/material-hooks.ts`
  - `src/entities/material/model/material-library-hooks.ts`
  - `src/entities/material/model/material-mutations.ts`
  - `src/entities/place-import/model/place-import-hooks.ts`
  - `src/entities/place-import/model/place-import-mutations.ts`
  - `src/entities/place/model/place-hooks.ts`
  - `src/entities/place/model/place-mutations.ts`
  - `src/features/category/create/ui/create-category-drawer.tsx`
  - `src/features/category/delete/ui/delete-category-button.tsx`
  - `src/features/category/edit/ui/edit-category-drawer.tsx`
  - `src/features/content-source/create/ui/create-content-source-drawer.tsx`
  - `src/features/content-source/edit/ui/edit-content-source-drawer.tsx`
  - `src/features/content-source/import/ui/import-telegram-source-button.tsx`
  - `src/features/content-source/status/ui/content-source-status-actions.tsx`
  - `src/features/material/admin-status/ui/material-admin-status-actions.tsx`
  - `src/features/material/create/ui/create-material-drawer.tsx`
  - `src/features/material/edit/ui/edit-material-drawer.tsx`
  - `src/features/material/link-existing/ui/link-existing-material-drawer.tsx`
  - `src/features/place/bulk-moderation/ui/bulk-moderation-toolbar.tsx`
  - `src/features/place/cover/ui/place-cover-upload-panel.tsx`
  - `src/features/place/create/ui/create-place-form.tsx`
  - `src/features/place/edit/ui/edit-place-form.tsx`
  - `src/features/place/import-yandex/model/use-captcha-viewer.ts`
  - `src/features/place/import-yandex/ui/place-import-actions.tsx`
  - `src/features/place/import-yandex/ui/place-import-start-form.tsx`
  - `src/features/place/pinned-material/ui/pinned-material-panel.tsx`
  - `src/features/place/status/ui/place-status-panel.tsx`
  - `src/widgets/content-sources/ui/import-runs-table.tsx`
  - `src/widgets/place-detail/ui/place-materials-panel.tsx`
  - `src/widgets/place-import-yandex/ui/place-import-yandex-screen.tsx`
- Modify focused legacy-error consumers:
  - `src/entities/content-source/model/content-source-mutations.test.tsx`
  - `src/entities/material/model/material-mutations.test.tsx`
  - `src/entities/place-import/model/place-import-events.test.tsx`
  - `src/entities/place/model/place-mutations.test.tsx`
  - `src/features/content-source/create/ui/create-content-source-drawer.test.tsx`
  - `src/features/content-source/import/ui/import-telegram-source-button.test.tsx`
  - `src/features/content-source/status/ui/content-source-status-actions.test.tsx`
  - `src/features/material/admin-status/ui/material-admin-status-actions.test.tsx`
  - `src/features/material/create/ui/create-material-drawer.test.tsx`
  - `src/features/material/link-existing/ui/link-existing-material-drawer.test.tsx`
  - `src/features/place/cover/ui/place-cover-upload-panel.test.tsx`
  - `src/features/place/create/ui/create-place-form.test.tsx`
  - `src/features/place/edit/ui/edit-place-form.test.tsx`
  - `src/features/place/form/ui/place-form-fields.test.tsx`
  - `src/features/place/import-yandex/ui/place-import-start-form.test.tsx`
  - `src/features/place/pinned-material/ui/pinned-material-panel.test.tsx`
  - `src/features/place/status/ui/place-status-panel.test.tsx`
  - `src/shared/ui/screen-state/screen-state.test.tsx`
  - `src/widgets/categories/ui/categories-screen.test.tsx`
  - `src/widgets/content-sources/ui/content-sources-screen.test.tsx`
  - `src/widgets/material-library/ui/material-library-inbox.test.tsx`
  - `src/widgets/place-detail/ui/place-detail-screen.test.tsx`
  - `src/widgets/place-detail/ui/place-materials-panel.test.tsx`
  - `src/widgets/place-edit/ui/place-edit-screen.test.tsx`
  - `src/widgets/place-import-yandex/ui/place-import-yandex-screen.test.tsx`
  - `src/widgets/places-list/ui/places-list.test.tsx`
- Modify: `docs/architecture/helper-registry.md`

**Interfaces:**

- `ProblemDocumentLike`;
- `ProblemCode`;
- `ApiProblemError`;
- `ApiNetworkError`;
- `ApiProtocolError`;
- `ApiClientError`;
- `normalizeApiError(error, now?)`;
- `isProblemCode(error, code)`;
- `ApiErrorPresentation`;
- `getApiErrorPresentation(error)`;
- `shouldRetryQuery(failureCount, error)`.

- [ ] **Step 1: Replace legacy error tests with strict protocol tests**

Create `api-errors.test.ts` with Axios error fixtures covering:

1. no HTTP response → `ApiNetworkError`;
2. non-Axios value → `ApiProtocolError`;
3. HTTP JSON/NestJS body without `application/problem+json` → `ApiProtocolError`;
4. malformed problem body → `ApiProtocolError`;
5. problem `status` not equal to HTTP status → `ApiProtocolError`;
6. valid Problem Details → `ApiProblemError` with `code`, `status`, `requestId`;
7. numeric `Retry-After` seconds → milliseconds;
8. future HTTP-date → milliseconds relative to injected `now`;
9. past/invalid `Retry-After` → `null`;
10. `isProblemCode` narrows only matching `ApiProblemError`.

The valid fixture must include raw strings that tests never expect UI to render:

```ts
const problem = {
  type: 'https://api.example.test/problems/internal-error',
  title: 'Raw backend title',
  status: 500,
  detail: 'Raw backend detail',
  instance: 'urn:request:test',
  code: 'INTERNAL_ERROR',
  requestId: 'request-500',
}
```

Run:

```bash
pnpm exec vitest run src/shared/api/client/api-errors.test.ts
```

Expected: FAIL because the strict classes do not exist.

- [ ] **Step 2: Implement the strict error model**

Port the starter model with the backend-generated code schema:

```ts
const problemDocumentSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string(),
  instance: z.string(),
  code: AuthGetCsrfToken401Response.shape.code,
  requestId: z.string(),
  errors: z
    .array(
      z.object({
        pointer: z.string(),
        code: z.string(),
        detail: z.string(),
      }),
    )
    .optional(),
})
```

`normalizeApiError` accepts an HTTP error only when:

- it is Axios;
- response media type, ignoring parameters, equals `application/problem+json`;
- runtime schema parses;
- body status equals response status.

Everything else becomes network or protocol error. Do not preserve the legacy `kind`, `messages`, `body`, `getApiErrorStatus`, `isApiClientError` API.

- [ ] **Step 3: Make Orval throw only the new union**

Update `ErrorType<ErrorData>`:

```ts
export type ErrorType<ErrorData> = ApiClientError<
  ErrorData & ProblemDocumentLike
>
```

Keep header merging and operational health `503` JSON exception. All other caught values go through `normalizeApiError`.

Re-export the new classes/functions/types from `src/shared/api/index.ts`.

- [ ] **Step 4: Write safe presentation tests before UI migration**

Create `api-error-presentation.test.ts` asserting:

| Input                    | Message                                            | Retryable | requestId         |
| ------------------------ | -------------------------------------------------- | --------- | ----------------- |
| `ApiNetworkError`        | `Не удалось подключиться к серверу.`               | `true`    | absent            |
| `ApiProtocolError`       | `Сервер вернул некорректный ответ.`                | `false`   | absent            |
| `AUTHORIZATION_DENIED`   | `Недостаточно прав для этого действия.`            | `false`   | absent            |
| `RATE_LIMIT_EXCEEDED`    | `Слишком много запросов. Повторите попытку позже.` | `false`   | absent            |
| `DEPENDENCY_UNAVAILABLE` | `Сервис временно недоступен.`                      | `true`    | problem requestId |
| `INTERNAL_ERROR`         | `Не удалось выполнить запрос.`                     | `true`    | problem requestId |
| unknown value            | `Произошла непредвиденная ошибка.`                 | `false`   | absent            |

Also assert the rendered/presentation output never contains fixture `title`, `detail` or field `detail`.

Implement:

```ts
export type ApiErrorPresentation = {
  message: string
  requestId?: string
  retryable: boolean
}

export function getApiErrorPresentation(error: unknown): ApiErrorPresentation
```

Add the helper and new error helpers to `docs/architecture/helper-registry.md`; remove legacy refresh/error rows.

- [ ] **Step 5: Convert query retry policy**

Write `src/app/query-client.test.ts` proving:

```ts
expect(shouldRetryQuery(0, new ApiNetworkError())).toBe(true)
expect(shouldRetryQuery(1, problemError(503))).toBe(true)
expect(shouldRetryQuery(2, problemError(503))).toBe(false)
expect(shouldRetryQuery(0, problemError(422))).toBe(false)
expect(shouldRetryQuery(0, new ApiProtocolError())).toBe(false)
```

Implement:

```ts
export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2 || error instanceof ApiProtocolError) return false
  if (error instanceof ApiNetworkError) return true
  return error instanceof ApiProblemError && error.status >= 500
}
```

Configure:

```ts
queries: {
  staleTime: 30_000,
  retry: shouldRetryQuery,
  refetchOnWindowFocus: false,
},
mutations: { retry: false },
```

- [ ] **Step 6: Migrate UI behavior from status/message to stable codes**

Across the listed production consumers:

- type hook errors as `ApiClientError`;
- replace numeric status branches with `isProblemCode`;
- use `getApiErrorPresentation` for generic safe feedback;
- keep product-specific local messages for stable codes;
- never use `error.message`, `problem.title`, `problem.detail` or `problem.errors[*].detail` in generic UI.

Required product branches:

| Existing scenario              | Stable backend code                                               |
| ------------------------------ | ----------------------------------------------------------------- |
| category duplicate slug        | `CATEGORY_SLUG_CONFLICT`                                          |
| deleting used category         | `CATEGORY_IN_USE`                                                 |
| missing category               | `CATEGORY_NOT_FOUND`                                              |
| duplicate content source       | `CONTENT_SOURCE_ALREADY_EXISTS`                                   |
| locked content-source identity | `CONTENT_SOURCE_IDENTITY_LOCKED`                                  |
| missing content source         | `CONTENT_SOURCE_NOT_FOUND`                                        |
| invalid Telegram source        | `TELEGRAM_IMPORT_SOURCE_INVALID`                                  |
| unavailable Telegram import    | `TELEGRAM_IMPORT_UNAVAILABLE`                                     |
| missing material               | `MATERIAL_NOT_FOUND`                                              |
| missing place                  | `PLACE_NOT_FOUND`                                                 |
| duplicate place slug           | `PLACE_SLUG_CONFLICT`                                             |
| active import recovery         | `PLACE_IMPORT_ALREADY_ACTIVE`                                     |
| invalid import input           | `PLACE_IMPORT_INPUT_INVALID`                                      |
| unavailable import service     | `PLACE_IMPORTS_UNAVAILABLE`                                       |
| expired/not-ready preview      | `PLACE_IMPORT_PREVIEW_EXPIRED` / `PLACE_IMPORT_PREVIEW_NOT_READY` |
| missing place-material record  | `MATERIAL_PLACE_NOT_FOUND`                                        |
| missing place-material link    | `PLACE_MATERIAL_LINK_NOT_FOUND`                                   |
| missing pinned material        | `PINNED_MATERIAL_NOT_FOUND`                                       |
| pinned material is not linked  | `PINNED_MATERIAL_NOT_LINKED`                                      |

`ScreenApiErrorState` must use `getApiErrorPresentation` and show `requestId` in a secondary AntD `Typography.Text` only when present.

Update focused tests to construct `ApiProblemError` with valid problem bodies and assert:

- code-specific UX still works;
- raw backend copy is absent;
- 401/403 are not treated interchangeably.

- [ ] **Step 7: Prove the legacy error API is gone**

Run:

```bash
rg -n "client/api-error(['\"]|$)|getApiErrorStatus|isApiClientError|NestErrorBody|ApiErrorKind" src docs/architecture/helper-registry.md
rg -n "problem\\.(title|detail)" src \
  --glob '!src/shared/api/client/api-errors.ts' \
  --glob '!src/shared/api/generated/**' \
  --glob '!src/shared/api/generated-zod/**'
pnpm exec vitest run src/shared/api/client/api-errors.test.ts src/shared/api/client/orval-mutator.test.ts src/shared/api/presentation/api-error-presentation.test.ts src/app/query-client.test.ts src/shared/ui/screen-state/screen-state.test.tsx
pnpm run typecheck
git diff --check
```

Expected:

- legacy symbol search has no production hits;
- raw Problem Details copy search has no UI hits;
- focused tests and typecheck PASS.

- [ ] **Step 8: Commit Task 5**

```bash
git add src docs/architecture/helper-registry.md
git commit -m "refactor(errors): adopt typed problem details"
```

---

## Task 6: Move Session, Login, Logout and Role UI to the Starter Contract

**Files:**

- Create: `src/entities/session/api/session.ts`
- Create: `src/entities/session/api/session.test.ts`
- Create: `src/entities/session/model/session-cache.ts`
- Create: `src/entities/session/model/session-cache.test.ts`
- Create: `src/entities/session/index.ts`
- Delete: `src/entities/session/api/session-api.ts`
- Delete: `src/entities/session/api/session-api.test.ts`
- Delete: `src/entities/session/model/current-user.ts`
- Delete: `src/entities/session/model/session-hooks.ts`
- Delete: `src/entities/session/model/session-hooks.test.tsx`
- Modify: `src/entities/session/ui/role-meta.ts`
- Modify: `src/entities/session/ui/role-tag.tsx`
- Modify: `src/entities/session/ui/role-tag.test.tsx`
- Create: `src/features/auth/login/model/login-errors.ts`
- Create: `src/features/auth/login/model/login-errors.test.ts`
- Create: `src/features/auth/login/model/use-login.ts`
- Create: `src/features/auth/login/model/use-login.test.tsx`
- Modify: `src/features/auth/login/ui/login-form.tsx`
- Modify: `src/features/auth/login/ui/login-form.test.tsx`
- Create: `src/features/auth/logout/model/use-logout.ts`
- Create: `src/features/auth/logout/model/use-logout.test.tsx`
- Modify: `src/features/auth/logout/ui/logout-button.tsx`
- Modify: `src/features/auth/logout/ui/logout-button.test.tsx`
- Modify: `src/widgets/auth-login/ui/auth-login-screen.tsx`
- Modify: `src/widgets/auth-login/ui/auth-login-screen.test.tsx`
- Modify: `src/widgets/admin-shell/ui/admin-shell.tsx`
- Modify: `src/widgets/admin-shell/ui/admin-shell.test.tsx`

**Interfaces:**

- `currentSessionQueryKey`;
- `currentSessionQueryOptions`;
- `useCurrentSession()`;
- `refreshCurrentSession(queryClient)`;
- `clearCurrentSession(queryClient)`;
- `useLogin(returnTo)`;
- `useLogout()`;
- current user DTO fields: `userId`, `normalizedEmail`, `roleKeys`, `permissions`.

- [ ] **Step 1: Write session cache contract tests**

Tests must prove:

- `currentSessionQueryKey()` is exactly the generated `authGetMe` key;
- `useCurrentSession` executes `authGetMe` with React Query’s `AbortSignal`;
- `refreshCurrentSession` invalidates and then fetches the current session;
- `clearCurrentSession` removes the query and clears CSRF;
- session helpers never write to local/session storage.

Implement the starter shape:

```ts
export const currentSessionQueryKey = getAuthGetMeQueryKey
export const currentSessionQueryOptions = getAuthGetMeQueryOptions

export function useCurrentSession() {
  return useSuspenseQuery({
    ...currentSessionQueryOptions(),
    queryFn: ({ signal }) => authGetMe(undefined, signal),
  })
}
```

`clearCurrentSession` owns only Query + CSRF cache. Bulk moderation draft remains an app/feature concern.

- [ ] **Step 2: Write safe login error mapping tests**

Port the starter allowlist:

```ts
export type LoginField = 'email' | 'password'

const fieldByPointer: Readonly<Record<string, LoginField>> = {
  '/email': 'email',
  '/password': 'password',
}
```

Tests must prove an unknown `/role` pointer is ignored. For login only, allow server field `detail` for `/email` and `/password`, because those fields are explicitly allowlisted. Generic/global errors still never expose backend detail.

`getLoginFormError` maps:

- `AUTHENTICATION_REQUIRED` → `Неверный email или пароль`;
- `RATE_LIMIT_EXCEEDED` → rate-limit copy;
- `DEPENDENCY_UNAVAILABLE` → temporary unavailable;
- network/protocol → safe transport copy;
- other problem → `Не удалось выполнить вход. Код запроса: ${requestId}`;
- unknown → `Не удалось выполнить вход.`

- [ ] **Step 3: Implement login mutation with CSRF handoff**

`useLogin(returnTo)`:

```ts
return useMutation({
  mutationFn: async (credentials: LoginRequestDto) => {
    const response = await authLogin(credentials)
    setCsrfToken(response.csrfToken)
    return response
  },
  onSuccess: () => {
    clearBulkModerationDraftSelection()
    navigate(sanitizeReturnTo(returnTo), { replace: true })
  },
})
```

Because `clearBulkModerationDraftSelection` is feature-owned, keep it in `use-login.ts`, not in session entity.

Update `LoginForm`:

- prop becomes `returnTo: string | null`;
- uses `login.mutateAsync(values)`;
- maps `VALIDATION_FAILED` only through the field pointer allowlist;
- otherwise displays safe global AntD feedback;
- no longer receives an `onLoggedIn` callback;
- keeps existing RHF/AntD fields and pending state.

Use MSW in the component test for:

- local validation without HTTP;
- 422 field mapping;
- 401 safe credentials copy;
- successful login stores CSRF, clears draft and navigates;
- successful login does not make an extra `/auth/me` request.

- [ ] **Step 4: Implement logout semantics**

`useLogout()` calls `authLogout()` and:

- on success clears current session + CSRF, clears bulk draft, replaces route with `/login`;
- on `AUTHENTICATION_REQUIRED` performs the same local cleanup/redirect;
- on all other errors preserves session, CSRF, draft and route.

`LogoutButton` shows `Не удалось выйти. Повторите попытку.` only for a non-auth failure and never renders raw backend copy.

Use MSW tests to assert the outgoing CSRF header and all three outcomes.

- [ ] **Step 5: Remove the user context and render the current DTO**

`AdminShell` reads:

```ts
const { data: user } = useCurrentSession()
```

Delete `CurrentUserContext` and every provider/import. Update role UI to accept arbitrary backend role keys:

```ts
export function getRoleMeta(roleKey: string): RoleMeta {
  return (
    roleMeta[roleKey] ?? {
      color: 'default',
      label: roleKey,
    }
  )
}
```

Render all `user.roleKeys` as tags with stable keys. Keep the neutral `Администратор` header copy and do not expose `normalizedEmail`, `userId` or permissions as debug UI.

- [ ] **Step 6: Update the login screen to query-string returnTo**

Replace location-state parsing with:

```ts
const returnTo = new URLSearchParams(location.search).get('returnTo')
```

Pass it to `<LoginForm returnTo={returnTo} />`. Tests must start at `/login?returnTo=%2Fplaces%3Fstatus%3Dhidden` and prove the prop survives a fresh router initialization.

- [ ] **Step 7: Verify and commit Task 6**

Run:

```bash
rg -n "CurrentUserContext|AuthMeResponse|user\\.role\\b|getCurrentUser|invalidateCurrentSession|removeCurrentSession|useCurrentSessionQuery|useLoginSession|useLogoutSession" src
pnpm exec vitest run src/entities/session src/features/auth src/widgets/auth-login/ui/auth-login-screen.test.tsx src/widgets/admin-shell/ui/admin-shell.test.tsx
pnpm run typecheck
git diff --check
```

Expected:

- legacy session/context names have no output;
- focused tests and typecheck PASS.

Commit:

```bash
git add src/entities/session src/features/auth src/widgets/auth-login src/widgets/admin-shell
git commit -m "refactor(auth): align session and auth features"
```

---

## Task 7: Replace Render-Time Guard with React Router Data Mode

**Files:**

- Create: `src/shared/routes/return-to.ts`
- Create: `src/shared/routes/return-to.test.ts`
- Create: `src/shared/routes/index.ts`
- Create: `src/app/router/loaders.ts`
- Create: `src/app/router/loaders.test.ts`
- Create: `src/app/router/route-error-presentation.ts`
- Create: `src/app/router/route-error-presentation.test.ts`
- Create: `src/app/router/route-error.tsx`
- Create: `src/app/router/route-error.test.tsx`
- Create: `src/app/router/protected-layout.tsx`
- Modify: `src/app/router/index.tsx`
- Modify: `src/app/router/index.test.tsx`
- Delete: `src/app/router/require-auth.tsx`
- Delete: `src/app/router/require-auth.test.tsx`
- Delete: `src/app/router/require-auth.module.css`
- Modify: `src/widgets/admin-shell/ui/admin-shell.tsx`
- Modify: `src/widgets/admin-shell/ui/admin-shell.test.tsx`

**Interfaces:**

- `sanitizeReturnTo(value)`;
- `createRequireSessionLoader(dependencies)`;
- `createRedirectAuthenticatedLoader(dependencies)`;
- `getRouteErrorPresentation(error)`;
- `RouteError`;
- `ProtectedLayout`;
- `protectedRouteChildren`;
- `createAppRoutes(queryClient)` or equivalent testable route factory;
- `router`.

- [ ] **Step 1: Write returnTo security tests**

`return-to.test.ts` must cover:

```ts
it.each([
  ['/places?status=hidden#row-1', '/places?status=hidden#row-1'],
  ['/login', '/'],
  ['/login?returnTo=/places', '/'],
  ['//evil.example/path', '/'],
  ['https://evil.example/path', '/'],
  [null, '/'],
])('sanitizes %s', (input, expected) => {
  expect(sanitizeReturnTo(input)).toBe(expected)
})
```

Implementation accepts only an app-absolute single-slash path and preserves its query/hash.

- [ ] **Step 2: Write loader unit tests**

For `createRequireSessionLoader` assert:

- passes `request.signal` into `load`;
- success returns `null`;
- `AUTHENTICATION_REQUIRED` calls `clear()` once and throws redirect to encoded pathname + query + hash;
- `AUTHORIZATION_DENIED`, network and protocol errors are rethrown;
- aborted auth error is rethrown without clear/redirect.

For `createRedirectAuthenticatedLoader` assert:

- successful session redirects to sanitized `returnTo` from the login URL;
- successful session without a valid `returnTo` redirects `/`;
- `AUTHENTICATION_REQUIRED` returns `null` and does not clear;
- all other errors are rethrown.

Use real `ApiProblemError` fixtures, not status mocks.

- [ ] **Step 3: Implement loader factories**

Port the starter contracts:

```ts
type SessionLoaderDependencies = {
  load: (signal: AbortSignal) => Promise<unknown>
  clear: () => void
}
```

Only `isProblemCode(error, 'AUTHENTICATION_REQUIRED')` enters auth control flow. The authenticated-login loader reads `returnTo` from `request.url` and passes it through `sanitizeReturnTo` before redirecting.

- [ ] **Step 4: Write and implement AntD route error presentation**

`getRouteErrorPresentation` may reuse `getApiErrorPresentation`, but route-specific `AUTHORIZATION_DENIED` copy is `Недостаточно прав для открытия страницы.`.

`RouteError` renders an AntD `Layout`/`Flex`/`Result`:

- title `Не удалось открыть страницу`;
- safe message;
- request ID when present;
- `Повторить` button only when retryable, calling `revalidator.revalidate()`.

It does not contain an auth redirect effect. Protected and login loaders own the session check and consume `AUTHENTICATION_REQUIRED` before it reaches the error element. Do not reintroduce `useEffect` or a render-time side effect.

- [ ] **Step 5: Build a testable route factory and fresh session loader**

In `index.tsx` implement:

```ts
async function loadSession(queryClient: QueryClient, signal: AbortSignal) {
  const session = await authGetMe(undefined, signal)
  if (signal.aborted) {
    throw new DOMException('The session request was aborted', 'AbortError')
  }
  queryClient.setQueryData(currentSessionQueryKey(), session)
  return session
}
```

Expose a documented `createAppRoutes(queryClient)` for `createMemoryRouter` tests, then:

```ts
export const router = createBrowserRouter(createAppRoutes(queryClient))
```

Protected parent:

- `path: '/'`;
- loader calls fresh `authGetMe` directly, not `fetchQuery` with potentially fresh cache;
- on auth loss clears session/CSRF and bulk moderation draft;
- element is `<ProtectedLayout />`;
- error element is `<RouteError />`;
- children remain the existing dashboard/admin route set.

Login sibling:

- `path: '/login'`;
- loader redirects authenticated users to sanitized `returnTo` or `/`;
- element `<LoginPage />`;
- error element `<RouteError />`.

Use relative child paths under the parent (`places`, `categories`, etc.); keep index dashboard and wildcard not-found.

- [ ] **Step 6: Implement protected layout and remove render-time guard**

`ProtectedLayout`:

```tsx
export function ProtectedLayout(): ReactNode {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  )
}
```

If `AdminShell` currently owns `<Outlet />`, change it to an explicit `children: ReactNode` API. This keeps route composition in `app`, while the widget owns only shell presentation.

Delete `RequireAuth`, its tests and CSS module. No loading screen is needed because the loader completes before protected render; router navigation state may be handled separately only if a product requirement emerges.

- [ ] **Step 7: Add MSW router integration tests**

Using `createMemoryRouter(createAppRoutes(testQueryClient), ...)` and the global MSW server, prove:

1. `/places?status=hidden` with a successful `/v1/auth/me` response renders the protected route and seeds `currentSessionQueryKey()`;
2. 401 Problem Details redirects to `/login?returnTo=%2Fplaces%3Fstatus%3Dhidden`, clears session/CSRF/draft;
3. 403 Problem Details renders route error and does not clear session as though logged out;
4. network/503 renders retryable error rather than login;
5. `/login?returnTo=%2Fplaces` redirects an authenticated user to `/places`;
6. unauthenticated `/login` remains on login;
7. aborting navigation prevents stale session data from being written.

Assert raw backend title/detail are absent.

- [ ] **Step 8: Verify no render-time auth bridge remains**

Run:

```bash
rg -n "RequireAuth|CurrentUserContext|state=\\{\\{ from|location\\.state|useEffect" src/app/router src/widgets/auth-login src/entities/session
pnpm exec vitest run src/shared/routes src/app/router src/widgets/auth-login/ui/auth-login-screen.test.tsx src/widgets/admin-shell/ui/admin-shell.test.tsx
pnpm run typecheck
git diff --check
```

Expected:

- no legacy auth guard/location-state hits;
- no auth/router `useEffect`;
- all router tests and typecheck PASS.

- [ ] **Step 9: Commit Task 7**

```bash
git add src/shared/routes src/app/router src/widgets/admin-shell src/widgets/auth-login
git commit -m "refactor(router): move auth guards to data loaders"
```

---

## Task 8: Document the New Foundation and Add the Aggregate Gate

**Files:**

- Modify: `package.json`
- Modify: `README.md`
- Create: `docs/architecture/api-auth-router-foundation.md`
- Modify: `docs/architecture/helper-registry.md`
- Modify: `docs/architecture/use-zod-form-starter-candidate.md`
- Modify: `docs/product/project-feature-gap.md`
- Modify: `docs/runbooks/production-env.md`

**Interfaces:**

- `typecheck`: `tsc -b --pretty false`;
- `check`: strict aggregate without Steiger;
- documented happy path: route loader → auth/me → Query cache → protected UI → unsafe mutation → CSRF → Problem Details.

- [ ] **Step 1: Make scripts match the actual project graph**

Update:

```json
{
  "typecheck": "tsc -b --pretty false",
  "check": "pnpm run api:check && pnpm run format:check && pnpm run lint:strict && pnpm run typecheck && pnpm run test && pnpm run build"
}
```

Do not add Steiger: full FSD slice enforcement is a separate migration and the current goal is the starter foundation boundary.

- [ ] **Step 2: Rewrite README source-of-truth and local development sections**

README must state:

- `VITE_API_BASE_URL=/` means same-origin API root, not `/v1`;
- Vite proxy forwards `/v1`;
- both generated TypeScript and generated Zod come from `openapi/openapi.json`;
- `pnpm run api:update` resolves the paired backend or accepts `OPENAPI_SPEC_SOURCE`;
- generated files are never manually edited;
- handwritten code imports through `@/shared/api`;
- `pnpm run check` is the aggregate local gate;
- MSW is globally active for tests, but has no default product handlers.

Remove the obsolete paragraph that says runtime API still comes from `openapi.yaml`.

- [ ] **Step 3: Add the short architecture happy path**

Create `docs/architecture/api-auth-router-foundation.md` with these sections:

1. `Source of truth`: backend `docs/api/openapi.json` → local snapshot → Orval TypeScript/Zod → curated API.
2. `Protected navigation`: router loader → fresh `/v1/auth/me` → Query cache → protected layout.
3. `Unsafe request`: generated fetcher → Orval mutator → Axios → cached/fetched CSRF → backend.
4. `Error path`: `application/problem+json` → runtime validation → typed error → stable code mapping.
5. `Session lifecycle`: login stores CSRF; logout/auth loss clears Query + CSRF + bulk draft.
6. `Testing`: MSW owns HTTP boundary, handler is local to each test, unhandled request fails.
7. `UI boundary`: AntD remains project UI; shadcn is intentionally not copied.

Document `AUTHORIZATION_DENIED` as an authorization screen/error, not session loss.

- [ ] **Step 4: Refresh tracking and operational docs**

In `docs/product/project-feature-gap.md`:

- replace `/auth/*` with `/v1/auth/*`;
- remove refresh-once and legacy NestJS normalization claims;
- record current CSRF/Problem Details/Data Router/MSW foundation as branch work, not merged `main`;
- point the backend blocker to issue `#157` and fixed backend PR `#160`;
- keep runtime smoke as an explicit remaining check until performed.

In `docs/runbooks/production-env.md`:

- define `VITE_API_BASE_URL` as `/` or absolute origin without `/v1`;
- give valid/invalid examples;
- explain that `/v1` belongs to endpoint paths;
- retain secret ownership boundaries.

Update `use-zod-form-starter-candidate.md` from “candidate” to “adopted alignment”: the admin hook now matches the pinned starter’s optional-options/type-only-import contract, while `RhfFormItem` remains AntD-specific.

In `helper-registry.md`:

- remove deleted refresh/status helpers;
- add env/URL, CSRF, Problem Details, presentation, returnTo, loader, session cache and query retry helpers;
- keep private helpers private;
- ensure every listed path exists.

- [ ] **Step 5: Audit TSDoc and architecture boundaries**

Run:

```bash
git diff origin/stage -- '*.ts' '*.tsx' \
  | rg "^\\+export (const|function|class|type|interface|enum)"
rg -n "@/shared/api/generated(-zod)?/" src \
  --glob '!src/shared/api/generated/**' \
  --glob '!src/shared/api/generated-zod/**'
rg -n "useEffect" src/app/router src/entities/session src/features/auth
rg -n "openapi\\.yaml|auth/refresh|VITE_API_BASE_URL=/v1" README.md docs package.json src .env.example Dockerfile
pnpm run lint:strict
```

Inspect every changed exported handwritten API against `docs/architecture/tsdoc-guidelines.md`. Expected:

- no undocumented export violations;
- no deep generated imports;
- no auth/router `useEffect`;
- no stale runtime docs.

- [ ] **Step 6: Verify and commit Task 8**

Run:

```bash
pnpm run typecheck
pnpm run format:check
git diff --check
```

Expected: all PASS.

Commit:

```bash
git add package.json README.md docs
git commit -m "docs: describe starter-aligned frontend foundation"
```

---

## Task 9: Combined Review, Final Verification and Runtime Smoke

Do not make a completion claim from individual focused tests. This task starts only after Tasks 1–8 are committed.

**Files:**

- Review: every file changed from `origin/stage`
- Modify: only files required by the combined review/fix wave
- No push/PR/merge/deploy

- [ ] **Step 1: Inspect the complete change as one foundation cutover**

Run:

```bash
git status -sb
git log --oneline --decorate origin/stage..HEAD
git diff --stat origin/stage...HEAD
git diff --check origin/stage...HEAD
git diff origin/stage...HEAD -- package.json orval.config.ts scripts/api src/shared/api src/entities/session src/features/auth src/app/router src/app/query-client.ts src/test
```

Review for:

- one OpenAPI source and no generated manual edits;
- no deep generated imports;
- no refresh compatibility layer;
- exact CSRF exclusion and concurrency safety;
- no raw backend details in UI;
- auth/authz distinction;
- AbortSignal propagation and stale cache write guard;
- returnTo open-redirect protection;
- bulk draft cleanup at exactly login/logout/auth-loss boundaries;
- AntD and current product behavior preserved;
- all changed exports documented.

- [ ] **Step 2: Run a single combined code review and bounded fix wave**

Apply all Critical/Important findings before final gates. Batch non-blocking Minor findings into one fix wave. After fixes, rerun only the focused tests for touched modules, then perform at most one combined re-review.

If fixes are needed, commit them:

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml Dockerfile .env.example vite.config.ts orval.config.ts .github/workflows/deploy-production.yml scripts/api openapi src/shared src/entities src/features src/widgets src/app src/test README.md docs
git commit -m "fix: harden starter foundation alignment"
```

Before staging, compare this explicit scope with `git status --short` and omit any path that contains an unrelated user change. Do not use `git add .`.

- [ ] **Step 3: Prove generated drift is zero**

The worktree must be clean before this step.

Run:

```bash
pnpm run api:check
git status -sb
```

Expected:

- `api:check` PASS;
- no generated or snapshot diff;
- branch remains only ahead of `origin/stage`.

- [ ] **Step 4: Run the full final verification set**

Run in this exact order:

```bash
pnpm run typecheck
pnpm run lint:strict
pnpm run test
pnpm run format:check
pnpm run build
pnpm run check
```

Expected: all commands exit `0`. `pnpm run check` repeats the aggregate boundary and proves the documented one-command gate works.

If one command fails:

1. do not call the task PASS;
2. rerun only the failing script/test while fixing;
3. commit the fix;
4. rerun this complete final sequence once.

- [ ] **Step 5: Smoke the built SPA routing**

In one terminal:

```bash
VITE_API_BASE_URL=/ pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort
```

In another:

```bash
curl -fsS http://127.0.0.1:4173/
curl -fsS 'http://127.0.0.1:4173/login?returnTo=%2Fplaces%3Fstatus%3Dhidden'
curl -fsS http://127.0.0.1:4173/places
```

Expected: all return the SPA HTML, including direct-route refresh paths.

- [ ] **Step 6: Smoke the real backend auth/CSRF flow when credentials are available**

Against the paired backend runtime, use a browser with credentials supplied outside repository and shell history:

1. open `/login?returnTo=%2Fplaces%3Fstatus%3Dhidden`;
2. login and confirm redirect to `/places?status=hidden`;
3. confirm Network shows `POST /v1/auth/login` without `X-CSRF-Token`;
4. trigger one safe reversible admin mutation in the agreed test data;
5. confirm a single `/v1/auth/csrf` fetch and `X-CSRF-Token` on the unsafe request;
6. trigger a second unsafe request and confirm token reuse;
7. logout and confirm `/v1/auth/logout`, cache cleanup and login redirect;
8. refresh the protected URL and confirm loader redirect preserves `returnTo`.

If backend, safe test data or credentials are unavailable, record this step as `BLOCKED` with the exact missing boundary. Do not downgrade the automated gates, and do not report runtime smoke as PASS.

- [ ] **Step 7: Record final evidence without publishing**

Run:

```bash
git status -sb
git log --oneline --decorate origin/stage..HEAD
git diff --stat origin/stage...HEAD
```

Expected: clean feature branch with the design, plan and implementation commits. Report:

- exact branch and HEAD;
- each verification command and fresh result;
- runtime smoke PASS or BLOCKED;
- any remaining non-foundation follow-ups;
- explicitly that no push, PR, merge or deployment was performed.

---

## Appendix A: Handwritten Generated-Import Migration Manifest

At design commit `d0fa59e`, the following handwritten files imported `@/shared/api/generated/**` or `@/shared/api/generated-zod/**`. Task 2 must inspect and migrate every path below to `@/shared/api`; regenerated files themselves are excluded.

- `src/app/router/require-auth.test.tsx`
- `src/app/store.test.ts`
- `src/entities/category/model/category-hooks.test.tsx`
- `src/entities/category/model/category-hooks.ts`
- `src/entities/category/model/category-mutations.test.tsx`
- `src/entities/category/model/category-mutations.ts`
- `src/entities/category/ui/category-status-tag.tsx`
- `src/entities/content-source/model/content-source-hooks.test.tsx`
- `src/entities/content-source/model/content-source-hooks.ts`
- `src/entities/content-source/model/content-source-mutations.test.tsx`
- `src/entities/content-source/model/content-source-mutations.ts`
- `src/entities/content-source/ui/content-source-meta.ts`
- `src/entities/import-run/model/import-run-cache.test.ts`
- `src/entities/import-run/model/import-run-cache.ts`
- `src/entities/import-run/model/import-run-events-parser.ts`
- `src/entities/import-run/model/import-run-events.test.tsx`
- `src/entities/import-run/model/import-run-hooks.test.tsx`
- `src/entities/import-run/model/import-run-hooks.ts`
- `src/entities/import-run/ui/import-run-meta.ts`
- `src/entities/material/model/material-hooks.test.tsx`
- `src/entities/material/model/material-hooks.ts`
- `src/entities/material/model/material-library-hooks.test.tsx`
- `src/entities/material/model/material-library-hooks.ts`
- `src/entities/material/model/material-mutations.test.tsx`
- `src/entities/material/model/material-mutations.ts`
- `src/entities/material/ui/material-library-cells.tsx`
- `src/entities/material/ui/material-meta.test.ts`
- `src/entities/material/ui/material-meta.ts`
- `src/entities/place-import/model/place-import-cache.test.ts`
- `src/entities/place-import/model/place-import-cache.ts`
- `src/entities/place-import/model/place-import-events-parser.ts`
- `src/entities/place-import/model/place-import-events.test.tsx`
- `src/entities/place-import/model/place-import-hooks.test.tsx`
- `src/entities/place-import/model/place-import-hooks.ts`
- `src/entities/place-import/model/place-import-mutations.ts`
- `src/entities/place-import/ui/place-import-meta.tsx`
- `src/entities/place/model/place-hooks.test.tsx`
- `src/entities/place/model/place-hooks.ts`
- `src/entities/place/model/place-mutations.test.tsx`
- `src/entities/place/model/place-mutations.ts`
- `src/entities/place/model/place-status.ts`
- `src/entities/place/ui/place-category-tag.tsx`
- `src/entities/place/ui/place-meta.ts`
- `src/entities/place/ui/place-status-tag.tsx`
- `src/entities/session/api/session-api.test.ts`
- `src/entities/session/api/session-api.ts`
- `src/entities/session/model/current-user.ts`
- `src/entities/session/model/session-hooks.test.tsx`
- `src/entities/session/model/session-hooks.ts`
- `src/entities/session/ui/role-meta.ts`
- `src/entities/session/ui/role-tag.tsx`
- `src/features/auth/login/model/login-form-schema.ts`
- `src/features/auth/login/ui/login-form.test.tsx`
- `src/features/auth/logout/ui/logout-button.test.tsx`
- `src/features/category/create/ui/create-category-drawer.test.tsx`
- `src/features/category/create/ui/create-category-drawer.tsx`
- `src/features/category/delete/ui/delete-category-button.tsx`
- `src/features/category/edit/ui/edit-category-drawer.test.tsx`
- `src/features/category/edit/ui/edit-category-drawer.tsx`
- `src/features/category/form/model/category-form-schema.ts`
- `src/features/category/form/model/category-form.test.ts`
- `src/features/category/form/model/category-form.ts`
- `src/features/content-source/create/ui/create-content-source-drawer.tsx`
- `src/features/content-source/edit/ui/edit-content-source-drawer.test.tsx`
- `src/features/content-source/edit/ui/edit-content-source-drawer.tsx`
- `src/features/content-source/form/model/content-source-form-schema.ts`
- `src/features/content-source/form/model/content-source-form.test.ts`
- `src/features/content-source/form/model/content-source-form.ts`
- `src/features/content-source/import/ui/import-telegram-source-button.test.tsx`
- `src/features/content-source/import/ui/import-telegram-source-button.tsx`
- `src/features/content-source/status/ui/content-source-status-actions.test.tsx`
- `src/features/content-source/status/ui/content-source-status-actions.tsx`
- `src/features/material/admin-status/ui/material-admin-status-actions.test.tsx`
- `src/features/material/admin-status/ui/material-admin-status-actions.tsx`
- `src/features/material/create/ui/create-material-drawer.tsx`
- `src/features/material/edit/ui/edit-material-drawer.test.tsx`
- `src/features/material/edit/ui/edit-material-drawer.tsx`
- `src/features/material/form/model/material-form-schema.ts`
- `src/features/material/form/model/material-form.test.ts`
- `src/features/material/form/model/material-form.ts`
- `src/features/material/link-existing/ui/link-existing-material-drawer.test.tsx`
- `src/features/material/link-existing/ui/link-existing-material-drawer.tsx`
- `src/features/material/link-existing/ui/link-existing-material-table.tsx`
- `src/features/place/bulk-moderation/model/bulk-moderation-draft-storage.test.ts`
- `src/features/place/bulk-moderation/model/bulk-moderation-slice.test.ts`
- `src/features/place/bulk-moderation/model/bulk-moderation-slice.ts`
- `src/features/place/bulk-moderation/ui/bulk-moderation-draft-restore-prompt.test.tsx`
- `src/features/place/bulk-moderation/ui/bulk-moderation-toolbar.tsx`
- `src/features/place/cover/ui/place-cover-upload-panel.test.tsx`
- `src/features/place/create/ui/create-place-form.test.tsx`
- `src/features/place/edit/ui/edit-place-form.test.tsx`
- `src/features/place/edit/ui/edit-place-form.tsx`
- `src/features/place/form/model/place-form-schema.ts`
- `src/features/place/form/model/place-form.test.ts`
- `src/features/place/form/model/place-form.ts`
- `src/features/place/import-yandex/model/place-import-start-schema.ts`
- `src/features/place/import-yandex/ui/place-import-actions.test.tsx`
- `src/features/place/import-yandex/ui/place-import-actions.tsx`
- `src/features/place/import-yandex/ui/place-import-captcha-panel.test.tsx`
- `src/features/place/import-yandex/ui/place-import-captcha-panel.tsx`
- `src/features/place/import-yandex/ui/place-import-preview.test.tsx`
- `src/features/place/import-yandex/ui/place-import-preview.tsx`
- `src/features/place/pinned-material/model/pinned-material.ts`
- `src/features/place/pinned-material/ui/pinned-material-current.tsx`
- `src/features/place/pinned-material/ui/pinned-material-panel.test.tsx`
- `src/features/place/pinned-material/ui/pinned-material-panel.tsx`
- `src/features/place/status/ui/place-status-panel.test.tsx`
- `src/features/place/status/ui/place-status-panel.tsx`
- `src/shared/api/place-import-contract.test.ts`
- `src/widgets/categories/ui/categories-drawers.tsx`
- `src/widgets/categories/ui/categories-screen.test.tsx`
- `src/widgets/categories/ui/categories-screen.tsx`
- `src/widgets/categories/ui/categories-table-columns.tsx`
- `src/widgets/categories/ui/categories-table.tsx`
- `src/widgets/content-sources/model/content-source-filters.ts`
- `src/widgets/content-sources/ui/content-source-filters-bar.tsx`
- `src/widgets/content-sources/ui/content-sources-drawers.tsx`
- `src/widgets/content-sources/ui/content-sources-screen.test.tsx`
- `src/widgets/content-sources/ui/content-sources-screen.tsx`
- `src/widgets/content-sources/ui/content-sources-table-columns.tsx`
- `src/widgets/content-sources/ui/content-sources-table.tsx`
- `src/widgets/content-sources/ui/import-run-events-subscriptions.tsx`
- `src/widgets/content-sources/ui/import-runs-table.tsx`
- `src/widgets/material-library/model/material-library-filters.ts`
- `src/widgets/material-library/ui/material-library-filter-bar.tsx`
- `src/widgets/material-library/ui/material-library-inbox.test.tsx`
- `src/widgets/material-library/ui/material-library-inbox.tsx`
- `src/widgets/material-library/ui/material-library-table.tsx`
- `src/widgets/place-detail/ui/place-detail-screen.test.tsx`
- `src/widgets/place-detail/ui/place-detail-screen.tsx`
- `src/widgets/place-detail/ui/place-materials-panel.test.tsx`
- `src/widgets/place-detail/ui/place-materials-panel.tsx`
- `src/widgets/place-detail/ui/place-materials-table.tsx`
- `src/widgets/place-edit/ui/place-edit-screen.test.tsx`
- `src/widgets/place-edit/ui/place-edit-screen.tsx`
- `src/widgets/place-import-yandex/ui/place-import-yandex-screen.test.tsx`
- `src/widgets/places-list/model/pagination.ts`
- `src/widgets/places-list/model/use-places-list-row-selection.ts`
- `src/widgets/places-list/ui/places-list.test.tsx`
- `src/widgets/places-list/ui/places-list.tsx`
- `src/widgets/places-list/ui/places-table-columns.tsx`
- `src/widgets/places-list/ui/places-table.tsx`

After migration, rerun the discovery command rather than trusting this static list:

```bash
rg -n "@/shared/api/generated(-zod)?/" src \
  --glob '!src/shared/api/generated/**' \
  --glob '!src/shared/api/generated-zod/**'
```

Expected: no output.
