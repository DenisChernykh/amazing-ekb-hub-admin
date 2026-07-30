# React Starter Foundation Alignment Design

## Статус документа

Дата: 2026-07-30.

Design согласован в диалоге до записи документа. Реализация ещё не начата.

Целевая ветка admin:
`refactor/react-starter-foundation`.

Проверенные исходные ревизии:

- `admin-codex@ffd3499` — merged RHF + Zod migration;
- `react-starter@872619e` — reusable frontend foundation;
- `backend-codex@6afe205` — актуальный product OpenAPI после merge PR #160.

Локальный `react-starter@b0188e2` содержит только более новый несвязанный
deployment design и не является источником runtime-кода этой миграции.

## Контекст

Admin уже использует Vite, React 19, Ant Design, TanStack Query, Axios, Orval,
Zod, React Hook Form и pragmatic FSD. Его продуктовые pages, widgets, features,
entities, AntD layout и bulk-moderation state остаются действующей основой.

При этом reusable foundation расходится с `react-starter`:

- runtime TypeScript/React Query client генерируется из старого
  `openapi.yaml`, а Zod schemas — из нового `openapi/openapi.json`;
- старый OpenAPI описывает retired refresh-token auth, тогда как backend
  использует opaque cookie session и CSRF;
- Axios client не реализует актуальный CSRF contract;
- ошибки нормализуются из legacy Nest body и status вместо строгого
  `application/problem+json`;
- protected routes проверяют auth внутри React component, а не Data Router
  loader;
- `returnTo` хранится только в navigation state и теряется после reload;
- MSW установлен, но не подключён к test lifecycle и не проверяет реальный
  HTTP boundary;
- application code массово импортирует generated deep paths;
- текущий `typecheck` запускает root `tsc --noEmit` и может не проверить
  project references.

Backend Problem Details drift устранён до начала frontend migration:

- malformed request остаётся `MALFORMED_REQUEST / 400`;
- DTO/path validation возвращает `VALIDATION_FAILED / 422`;
- generic fallback использует `NOT_FOUND`;
- OpenAPI публикует `X-CSRF-Token`;
- auth OpenAPI разделяет `400` и `422`.

Поэтому frontend не должен поддерживать два backend-контракта или добавлять
compatibility layer для старого API.

## Цель

Атомарно заменить auth, HTTP error handling, router foundation, Orval pipeline
и HTTP-boundary testing в admin на актуальные контракты `react-starter`,
сохранив Ant Design и продуктовую архитектуру Amazing EKB.

После cutover:

```text
backend-codex OpenAPI
→ openapi/openapi.json
→ Orval TypeScript + Zod
→ curated shared/api
→ entity/feature adapters
→ pages/widgets
```

В runtime:

```text
navigation
→ protected route loader
→ GET /v1/auth/me
→ session cache
→ AdminShell
→ product route
```

Unsafe mutation:

```text
feature mutation
→ generated operation
→ apiMutator
→ Axios
→ in-memory CSRF token
→ backend
→ typed Problem Details or success DTO
```

## Выбранный вариант

Выбран ограниченный атомарный frontend foundation cutover.

Он шире минимального auth-патча, потому что регенерация актуального OpenAPI
меняет operation names, DTO, error types, path prefixes и все API consumers.
Оставить часть приложения на legacy generated client означало бы сохранить
split-brain contract.

Он уже полного копирования `react-starter`, потому что UI foundation,
product slices и полная FSD-нормализация не нужны для корректного auth/API
cutover.

Реализация выполняется в одной feature-ветке и одном PR последовательными
коммитами. В пределах ветки допустимы временно падающие промежуточные commits,
но итоговый branch state содержит только один runtime contract.

## Не входит в scope

- замена Ant Design на shadcn/Base UI;
- Tailwind, starter fonts, starter layout или visual redesign;
- перенос reference `approval-requests`;
- изменение backend contract после `backend-codex@6afe205`;
- сохранение legacy `/auth/refresh`;
- dual-mode для старого и нового API;
- изменение Redux bulk-moderation behavior;
- переработка продуктовых pages, widgets и navigation;
- массовый перенос всех unit tests на MSW;
- полный FSD public API cleanup всех slices;
- добавление Steiger как blocking gate;
- перенос TanStack Query ESLint policy целиком;
- deployment, push, PR или merge без отдельного запроса пользователя.

## OpenAPI и Orval

### Единственный snapshot

`openapi/openapi.json` становится единственным входом для обоих Orval outputs:

1. TypeScript/Axios/React Query;
2. Zod 4 schemas.

Старый root `openapi.yaml` удаляется после успешной регенерации. Generated
файлы не редактируются вручную.

Admin сохраняет собственный sync script с поддержкой primary worktree,
temporary worktree и `OPENAPI_SPEC_SOURCE`. Его нельзя заменять более простым
starter script, потому что текущая worktree resolution является
product-specific operational contract.

Sync validation дополнительно требует общие auth operations:

- `authGetCsrfToken`;
- `authLogin`;
- `authLogout`;
- `authGetMe`.

Существующие обязательные product operations сохраняются.

`api:check` обязан повторно генерировать оба output и падать при любом tracked
drift. Проверка не должна условно пропускать Git diff внутри обычного worktree.

### Curated public API

Создаётся `src/shared/api/index.ts`. Handwritten entity/feature/widget/page code
импортирует из него только реально используемые:

- generated operations;
- DTO и enum-like types;
- query keys/options;
- Zod schemas;
- transport error types и predicates.

В этой миграции все handwritten imports из
`src/shared/api/generated/**` и `src/shared/api/generated-zod/**` переводятся
на curated boundary. Полный public API cleanup остальных FSD slices остаётся
отдельной задачей и не смешивается с API boundary.

## Runtime API origin

Актуальные generated paths уже содержат `/v1`. Поэтому
`VITE_API_BASE_URL` означает API origin, а не API prefix.

Допустимые формы:

- `/` для same-origin/Vite proxy;
- `https://api.example.com` для отдельного production origin.

Значение `/v1` больше недопустимо, иначе запрос станет `/v1/v1/...`.

Нормализация:

- принимает `/`;
- для абсолютного URL запрещает pathname кроме `/`;
- удаляет завершающий slash у абсолютного origin;
- отклоняет не-HTTP(S) protocol;
- сообщает configuration error до первого API request.

Обновляются:

- `.env.example`;
- Docker build arg default;
- production workflow contract;
- production env runbook;
- тесты base URL;
- ручные SSE URLs.

SSE transports должны передавать в `buildApiUrl` полные product paths:

- `/v1/admin/import-runs/...`;
- `/v1/admin/place-imports/...`.

Actual GitHub environment value не изменяется этой веткой автоматически.
Runbook фиксирует обязательную operator-проверку перед следующим production
build.

## Axios, cookie session и CSRF

Общий Axios instance:

- использует проверенный API origin;
- всегда отправляет credentials;
- для unsafe methods задаёт JSON content type;
- преобразует отсутствующий body в `{}`;
- не запрашивает CSRF для login;
- добавляет `X-CSRF-Token` к остальным `POST`, `PUT`, `PATCH`, `DELETE`;
- нормализует Axios failures в typed application errors.

Frontend не читает и не хранит opaque session cookie.

CSRF token хранится только в памяти:

- login response устанавливает token;
- первый unsafe request при отсутствии token вызывает
  `GET /v1/auth/csrf`;
- параллельные callers разделяют один in-flight request;
- generation guard не позволяет старому response восстановить очищенный token;
- logout и authentication loss очищают token;
- localStorage, sessionStorage, IndexedDB и persisted query cache не
  используются.

Legacy 401 refresh interceptor и `/auth/refresh` удаляются полностью.

## Problem Details

### Transport normalization

Axios error преобразуется в один из трёх типов:

1. `ApiNetworkError` — response отсутствует;
2. `ApiProtocolError` — content type, body или status нарушает OpenAPI
   Problem Details contract;
3. `ApiProblemError` — валидный `application/problem+json`.

`ApiProblemError` сохраняет:

- HTTP status;
- stable `code`;
- `requestId`;
- validation `errors[]`;
- parsed `retryAfterMs`, когда header допустим.

Response считается protocol error, если:

- media type не `application/problem+json`;
- runtime schema не проходит;
- body status не совпадает с HTTP status;
- validation response не соответствует `VALIDATION_FAILED / 422`;
- обязательные поля отсутствуют.

### Presentation policy

UI принимает решения по `code`, не по `title`, `detail` или произвольному
backend message.

Безопасная общая presentation mapping:

- authentication loss → router revalidation/redirect;
- authorization denied → access-denied state;
- validation pointers → только allowlisted form fields;
- dependency/network failure → retryable technical state;
- unknown product problem → generic message плюс `requestId` для диагностики.

Raw backend `detail` не показывается как универсальное пользовательское
сообщение. Product-specific features могут определить собственный safe mapping
для известных codes.

Существующие status-based branches мигрируют на stable product codes. Старый
`ApiClientError` удаляется после переноса последнего consumer.

## Query client

Сохраняется admin product policy `staleTime: 30_000`, если конкретный query не
переопределяет её.

Retry policy выравнивается со starter:

- retry для network error;
- retry для `ApiProblemError` с server status `5xx`;
- без retry для authentication, authorization, validation и `4xx`;
- без retry для `ApiProtocolError`;
- mutations по умолчанию не retry;
- `refetchOnWindowFocus: false`.

Session authentication decision не полагается на stale cache и всегда делает
fresh request из route loader.

## Session model

Старый `CurrentUser` shape `id/email/role` заменяется backend DTO:

- `userId`;
- `normalizedEmail`;
- `roleKeys`;
- `permissions`.

Session entity владеет:

- query key;
- query options/hook;
- cache write/clear helpers;
- auth-loss cleanup;
- адаптацией display values для AdminShell.

`roleKeys` не сжимается обратно в один legacy `role`. AdminShell показывает
безопасное представление списка ролей или нейтральный fallback.

Bulk moderation draft очищается в единой auth-loss/logout cleanup path. Для
этого не используется component `useEffect`.

## React Router Data Mode

### Protected branch

Product route tree сохраняется, но помещается под один protected parent:

```text
createBrowserRouter
├── /login
│   ├── redirect-authenticated loader
│   ├── AuthLoginPage
│   └── RouteError
└── /
    ├── require-session loader
    ├── AdminShell + Outlet
    ├── RouteError
    └── existing product children
```

Protected loader:

1. выполняет fresh `authGetMe` с `request.signal`;
2. записывает session в общий QueryClient;
3. допускает navigation при success;
4. очищает session/CSRF/draft только при `AUTHENTICATION_REQUIRED`;
5. redirect на login с sanitized `returnTo`;
6. пробрасывает остальные errors в route error boundary.

`AUTHORIZATION_DENIED`, network, dependency и protocol error не маскируются
под anonymous session.

Login loader выполняет fresh session check и redirect authenticated user на
sanitized target/default route.

### Return target

`returnTo` сериализуется в query string, поэтому переживает reload. Он включает
pathname, search и hash, но проходит `sanitizeReturnTo`:

- только same-origin absolute path;
- начинается с `/`;
- не начинается с `//`;
- login route не может быть конечной целью;
- invalid value заменяется default protected route.

Component `RequireAuth` и его loading CSS удаляются после включения loader
boundary.

## MSW

MSW является активной частью test foundation.

`src/test/setup.ts` сохраняет существующие:

- AntD/browser polyfills;
- `matchMedia`;
- `ResizeObserver`;
- Zod Russian locale.

К ним добавляется server lifecycle:

- `server.listen({ onUnhandledRequest: 'error' })`;
- cleanup и `resetHandlers()` после каждого теста;
- `server.close()` после suite;
- общий handlers list по умолчанию пуст.

MSW используется там, где проверяется HTTP boundary:

- Axios/request config;
- credentials и empty unsafe body;
- CSRF fetch/cache/generation behavior;
- Problem Details normalization;
- login/logout transport;
- protected/login route loaders;
- `returnTo`;
- session loss и error boundary.

Чистые model/cache unit tests могут сохранить module mocks. Они mock-ают
curated `shared/api`, а не generated deep internals.

Существующие product tests не переписываются массово только ради MSW.

## Zod locale и forms

Существующий `z.config(ru())` должен выполняться до первого schema parse в
runtime и tests.

Уже внедрённый `useZodForm` сохраняется. Он выравнивается со starter только в
трёх точках:

- type-only import `z`;
- optional `options`;
- TSDoc, явно описывающий input/output contract.

RHF/AntD forms и payload adapters не мигрируют повторно.

## Dependencies и tooling

Общие foundation packages выравниваются с `react-starter@872619e`:

- React Router `8.3.0`;
- Orval `8.23.0`;
- Axios `1.18.1`;
- TanStack Query `^5.101.4`;
- Zod `^4.4.3`;
- React Hook Form `^7.83.0`;
- MSW `2.15.0`;
- связанные React/Vite/Vitest patch/minor versions.

`packageManager` и engines:

- Node.js `24.18.0`;
- pnpm `11.15.1`.

Добавляется pnpm allow-build policy для `esbuild` и `msw`.

Admin-specific quality contracts сохраняются:

- AntD dependencies;
- Redux;
- Husky/lint-staged;
- strict TSDoc lint;
- helper registry;
- Prettier import organization.

`typecheck` заменяется на project-reference-aware command:

```text
tsc -b --pretty false
```

Root `tsc --noEmit` с `files: []` не считается проверкой.

Добавляется агрегирующий `pnpm check`, который запускает существующие admin
gates и `api:check`, но не добавляет Steiger в этот slice.

## Документация

В той же ветке обновляются:

- README: единый OpenAPI/Orval runtime contract;
- `docs/product/project-feature-gap.md`: новый auth/error/router baseline;
- production env runbook: API origin semantics;
- architecture docs: Router Data Mode, cookie/CSRF, Problem Details, MSW;
- helper registry для новых handwritten helpers;
- TSDoc для всех новых или изменённых exported handwritten APIs.

Документация не заявляет production readiness без runtime smoke и не заявляет
full FSD parity без отдельного Steiger slice.

## Порядок cutover

1. Зафиксировать toolchain/package versions и API origin contract.
2. Переключить Orval на один backend snapshot.
3. Перегенерировать TypeScript и Zod outputs, удалить legacy snapshot.
4. Создать curated `shared/api` и перенести затронутые consumers.
5. Включить Axios cookie/CSRF и typed Problem Details.
6. Перенести product error branches и query retry policy.
7. Перенести session model и AdminShell user projection.
8. Переключить router на Data Mode loaders/error boundaries.
9. Подключить MSW и HTTP-boundary tests.
10. Исправить typecheck/check scripts и документацию.
11. Выполнить полный gate и локальный runtime smoke.

Нельзя оставлять ветку в состоянии, где runtime generated client берётся из
старого OpenAPI, а Zod — из нового.

## Verification

### Static/generated

- `pnpm run api:update` с
  `OPENAPI_SPEC_SOURCE=/Users/denischernykh/projects/pet/amazing-ekb-hub/backend-codex/docs/api/openapi.json`;
- review generated diff;
- `pnpm run api:check`;
- `pnpm run typecheck`;
- `pnpm run lint:strict`;
- `pnpm run format:check`;
- `pnpm run build`.

### Tests

- focused transport/error/CSRF tests;
- focused session/router/MSW tests;
- existing auth tests;
- existing product test suite;
- `pnpm run test`;
- итоговый `pnpm check`.

### Runtime smoke

С запущенным backend проверяются:

1. anonymous deep link → login с сохранённым `returnTo`;
2. login → исходный deep link;
3. reload protected route → fresh session check;
4. unsafe mutation → корректный CSRF header;
5. logout → cookie/session/cache/draft cleanup;
6. `AUTHENTICATION_REQUIRED` → login;
7. `AUTHORIZATION_DENIED` → error boundary, не login;
8. backend unavailable → network state, не login;
9. SSE URLs содержат один `/v1`;
10. production-like API origin не создаёт `/v1/v1`.

## Acceptance criteria

- В репозитории нет legacy `openapi.yaml` и `/auth/refresh` runtime path.
- TypeScript и Zod генерируются из одного committed backend snapshot.
- Handwritten application code не импортирует generated deep paths; такие
  imports остаются только внутри generated output и curated `shared/api`.
- Cookie credentials и CSRF соответствуют backend contract.
- Error decisions используют stable Problem Details codes.
- Protected auth decision выполняется route loader.
- `returnTo` безопасен и переживает reload.
- MSW реально проверяет transport/auth/router boundary.
- AntD, product pages, widgets, features, Redux state и form UX сохранены.
- `typecheck` проверяет project references.
- `api:check`, полный admin gate и runtime smoke проходят.

## Follow-up после этой миграции

Отдельными задачами могут выполняться:

- полный public API cleanup всех FSD slices;
- включение Steiger;
- TanStack Query ESLint policy;
- дальнейшее package parity;
- production deployment/runtime verification.

Эти follow-up не являются скрытыми условиями готовности текущего cutover.
