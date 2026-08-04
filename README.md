# Amazing EKB Hub Admin

Отдельная Vite SPA админка для Amazing EKB Hub.

## Stack

- React
- TypeScript
- Vite
- Ant Design
- React Router
- TanStack Query
- Axios
- Orval
- Vitest

## Local Development

```bash
pnpm install
pnpm run dev
```

`VITE_API_BASE_URL=/` по умолчанию означает same-origin корень API, а не
`/v1`. Versioned endpoint paths, включая `/v1/auth/me`, принадлежат вызовам
клиента. Для локальной разработки Vite proxy пересылает именно `/v1` в backend.

Для внешнего backend задайте `VITE_API_BASE_URL` абсолютным HTTP(S) origin без
пути, query и fragment, например `https://api.example.test`. Не добавляйте
`/v1` к этой переменной.

## Scripts

```bash
pnpm run dev
pnpm run typecheck
pnpm run lint:strict
pnpm run lint:tsdoc # отдельная необязательная TSDoc-задача
pnpm run test
pnpm run format:check
pnpm run build
pnpm run api:sync
pnpm run api:generate
pnpm run api:update
pnpm run api:check
pnpm run check
```

`pnpm run check` — полный локальный aggregate gate: он проверяет актуальность
контрактов, форматирование, строгий lint, типы, тесты и production build. TSDoc
в него не входит.
`pnpm run api:check` сначала повторно генерирует оба API output, затем отклоняет
staged, unstaged и untracked изменения snapshot, generated TypeScript и
generated Zod.

## API Source of Truth

Оба generated outputs — TypeScript client и Zod schemas — строятся из локального
snapshot `openapi/openapi.json`. `pnpm run api:update` сначала находит парный
backend artifact `docs/api/openapi.json` относительно основного admin checkout,
затем валидирует и сохраняет snapshot, после чего запускает Orval. Если backend
работает в отдельном worktree, источник можно передать явно:

```bash
OPENAPI_SPEC_SOURCE=/absolute/path/to/backend-worktree/docs/api/openapi.json \
  pnpm run api:update
```

Сам artifact собирается в backend командой `pnpm run openapi:generate`; admin
только валидирует его, сохраняет `openapi/openapi.json` и запускает Orval.
Generated files никогда не редактируются вручную. Рукописный код импортирует
курируемый контракт только через `@/shared/api`, а не из generated directory.

## Tests

MSW включён глобально для тестов и владеет HTTP boundary. Product handlers не
заданы по умолчанию: каждый тест объявляет только нужный ему handler, а
необработанный запрос завершает тест ошибкой.

## Documentation

- [Project Feature Gap](docs/product/project-feature-gap.md): что умеет backend, что покрыто public frontend/admin SPA, каких фич не хватает.
- [React Guidelines](docs/architecture/react-guidelines.md): conditional rendering и политика `useEffect`.
- [Helper Registry](docs/architecture/helper-registry.md): реестр helper'ов перед добавлением новых.
- [TSDoc Guidelines](docs/architecture/tsdoc-guidelines.md): правила документирования exported API.
- [API/Auth/Router Foundation](docs/architecture/api-auth-router-foundation.md): source of truth, session и transport happy path.
- [Agent Rules](AGENTS.md): рабочие правила для Codex/агента в этом репозитории.
