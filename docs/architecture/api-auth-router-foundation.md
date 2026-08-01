# API, Auth, and Router Foundation

Этот документ описывает текущий foundation branch. Он фиксирует уже принятые
границы кода, но не является подтверждением merge в `main` или runtime smoke.

## Source of truth

Backend создаёт `docs/api/openapi.json`. `pnpm run api:update` находит этот
artifact у парного backend checkout или берёт `OPENAPI_SPEC_SOURCE`, сохраняет
проверенный snapshot в `openapi/openapi.json` и запускает Orval. Один snapshot
создаёт generated TypeScript client и generated Zod schemas. Рукописный код
работает через curated boundary `@/shared/api`; generated outputs не
редактируются вручную. `pnpm run api:check` повторяет генерацию и падает при
staged, unstaged или untracked drift любого из этих трёх artifacts.

## Protected navigation

Data Router loader для protected route всегда выполняет свежий
`GET /v1/auth/me`. Успешный ответ записывается в Query cache, затем рендерится
`ProtectedLayout` и вложенный protected UI. Только
`AUTHENTICATION_REQUIRED` очищает session state и переводит на `/login` с
безопасным `returnTo`; прочие ошибки остаются у route error boundary.

Ошибки product queries и mutations проходят через общие callbacks
`QueryCache`/`MutationCache`. `AUTHENTICATION_REQUIRED` попадает в один
app-level auth-loss handler: он очищает session Query, CSRF и bulk draft, затем
делает replace-навигацию на login с текущими pathname, query и hash в
очищенном `returnTo`. Credential 401 на login остаётся локальной ошибкой формы,
а logout сам владеет своим 401 cleanup; обе auth mutations явно исключены из
глобального handler.

## Unsafe request

Generated fetcher передаёт запрос в Orval mutator, затем в Axios. Для unsafe
метода Axios использует сохранённый CSRF token либо запрашивает его один раз
для параллельных вызовов через `/v1/auth/csrf`; login — единственное точное
исключение. После этого запрос с `X-CSRF-Token` и cookie credentials уходит в
backend.

## Error path

Ответ с `application/problem+json` проходит runtime validation и превращается
в typed API error. UI и router используют stable backend code для безопасного
локального текста, retry policy и, когда допустимо, request ID. В частности,
`AUTHORIZATION_DENIED` — это экран/ошибка недостаточных прав, а не потеря
сессии. Validation problem допустим только как
`VALIDATION_FAILED` + HTTP/body status `422` + обязательный `errors[]`;
другой code со status `422` считается protocol error.

## Session lifecycle

Успешный login сохраняет выданный CSRF token. Logout и подтверждённая потеря
аутентификации очищают Query cache текущей сессии, CSRF token и feature-owned
bulk moderation draft. Другие logout errors не очищают локальное состояние,
чтобы пользователь мог повторить действие. Потерю сессии из route loader и
product Query/Mutation errors обрабатывают разные входы в один cleanup
контракт, без component effect или render-time side effect.

## Testing

MSW владеет HTTP boundary в тестах. Каждый test case устанавливает нужный ему
handler локально; общих product handlers нет, а unhandled request завершает
test ошибкой. Чистые model helpers по-прежнему можно проверять без HTTP
transport, если это не скрывает integration contract.

## UI boundary

Ant Design остаётся UI foundation админки. shadcn намеренно не копируется:
выравнивание со starter относится к transport, router, contracts и form hook,
а не к замене проектного UI kit.
