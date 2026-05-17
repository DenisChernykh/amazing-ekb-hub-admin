# Project Feature Gap

Документ фиксирует, что уже умеет backend Amazing EKB Hub, что покрыто публичным frontend и текущей admin SPA, а каких продуктовых фич не хватает.

## Источники

- Backend: `../backend`.
- Backend OpenAPI: `../backend/docs/api/specification.yaml`.
- Backend MVP spec: `../backend/docs/MVP_SPEC.md`.
- Backend module map: `../backend/docs/architecture/module-map.md`.
- Backend controllers: `../backend/src/modules/**/presentation/http/*controller.ts`.
- Public frontend: `../frontend`.
- Admin SPA: текущий репозиторий `admin-codex`.

## Backend Capabilities

Backend уже предоставляет четыре группы API.

### Auth

| API                  | Возможность                                                                | Auth        | Текущий UI coverage                                                                              |
| -------------------- | -------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `POST /auth/login`   | Вход по email/password, установка HttpOnly cookies, ответ `AuthMeResponse` | public      | Есть в admin SPA, есть в public frontend login                                                   |
| `POST /auth/refresh` | Обновление access/refresh cookies без body                                 | public      | Есть в admin transport; public frontend может быть устаревшим относительно cookie-only контракта |
| `POST /auth/logout`  | Отзыв refresh token и очистка cookies                                      | public      | Есть в admin SPA, есть в public frontend session layer                                           |
| `GET /auth/me`       | Профиль текущего пользователя                                              | cookie auth | Есть в admin route guard, есть в public frontend session layer                                   |

Auth-контракт backend сейчас cookie-only: токены передаются через HttpOnly cookies, не через frontend-readable storage.

### Public Places

| API                               | Возможность                                                    | Основные поля/параметры                                                  | Текущий UI coverage                                                                       |
| --------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `GET /places`                     | Пагинированный список активных мест                            | `page`, `pageSize`, `search`, `category`, `sort=popular`; `PlaceSummary` | Частично есть в public frontend: список, карточки, пагинация                              |
| `GET /places/{placeId}`           | Детальная карточка места                                       | `PlaceDetail`, `pinnedMaterial`, counters by platform                    | Есть в public frontend detail page                                                        |
| `GET /places/{placeId}/photo`     | Публичная выдача cover-фото                                    | binary stream                                                            | Используется через `coverImageUrl` в public frontend                                      |
| `GET /places/{placeId}/materials` | Bounded список материалов активного места с фильтром платформы | `platform`; `MaterialListResponse { items }`                             | Частично есть в public frontend: detail page пока должен убрать `pageSize=100` workaround |

### Favorites

| API                           | Возможность                        | Auth        | Текущий UI coverage |
| ----------------------------- | ---------------------------------- | ----------- | ------------------- |
| `GET /favorites`              | Список избранных мест пользователя | cookie auth | Не покрыто UI       |
| `POST /favorites/{placeId}`   | Добавить место в избранное         | cookie auth | Не покрыто UI       |
| `DELETE /favorites/{placeId}` | Удалить место из избранного        | cookie auth | Не покрыто UI       |

Favorites реализованы на backend, но в публичном frontend пока нет пользовательского сценария избранного.

### Admin Content Management

| API                                             | Возможность                                              | Auth    | Текущий UI coverage                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------- | -------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /admin/places`                             | Административный список мест, включая `active/hidden`    | `admin` | Есть admin list + status filter                                                                                                                                                                                                                                                                                                        |
| `GET /admin/places/{placeId}`                   | Административная detail-карточка независимо от статуса   | `admin` | Есть read-only detail shell                                                                                                                                                                                                                                                                                                            |
| `POST /admin/places`                            | Создать место                                            | `admin` | Есть create form в admin SPA                                                                                                                                                                                                                                                                                                           |
| `PATCH /admin/places/{placeId}`                 | Редактировать место                                      | `admin` | Есть edit form в admin `main`                                                                                                                                                                                                                                                                                                          |
| `PATCH /admin/places/{placeId}/status`          | Скрыть/опубликовать место через `active/hidden`          | `admin` | Есть status panel на detail                                                                                                                                                                                                                                                                                                            |
| `POST /admin/places/{placeId}/photo`            | Загрузить или заменить cover-фото, JPEG/PNG/WebP до 5 MB | `admin` | Есть cover upload panel в admin `main`                                                                                                                                                                                                                                                                                                 |
| `GET /admin/places/{placeId}/materials`         | Bounded список материалов места, включая `hidden` places | `admin` | Есть sync в admin `main` через merged admin PR [#10](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/10)                                                                                                                                                                                                                   |
| `POST /admin/places/{placeId}/materials`        | Создать материал для места                               | `admin` | Есть в admin `main` через merged admin PR [#12](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/12): drawer form on detail                                                                                                                                                                                                 |
| `PATCH /admin/materials/{materialId}`           | Редактировать материал                                   | `admin` | Есть в admin `main` через merged admin PR [#12](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/12): drawer form with dirty diff chips                                                                                                                                                                                     |
| `PATCH /admin/places/{placeId}/pinned-material` | Назначить pinned material для блока “Начни отсюда”       | `admin` | Есть set/change selector на admin detail; снятие закрепления заблокировано backend-контрактом, потому что request требует `materialId: string`; backend follow-up: [#45](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/45), admin follow-up: [#13](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/13) |

Backend уже закрывает обязательные admin-функции из MVP: create/update/hide place, create/update material, set pinned material, upload cover photo.

### Health

| API                 | Возможность                      | UI coverage                      |
| ------------------- | -------------------------------- | -------------------------------- |
| `GET /health/live`  | Liveness probe                   | Нет UI, нужен только runtime/ops |
| `GET /health/ready` | Readiness probe c database check | Нет UI, нужен только runtime/ops |

## Public Frontend Coverage

Соседний `../frontend` сейчас покрывает основную публичную витрину.

Есть:

- главная `/` со списком мест;
- server-side загрузка `GET /places`;
- пагинация каталога;
- detail route `/places/[placeId]`;
- server-side загрузка `GET /places/{placeId}`;
- загрузка материалов по платформам через `GET /places/{placeId}/materials`;
- отображение counters, pinned material, тегов, cover image;
- login route и session/auth-lab слой.

Не хватает:

- видимых controls для поиска, фильтра категории и сортировки, хотя backend и query normalization это поддерживают;
- пользовательского сценария избранного: favorite toggle на карточке/detail, страница “Избранное”, optimistic/pending/error состояния;
- убрать временный `pageSize=100` workaround для материалов после backend issue [#28](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/28) и public frontend issue [#17](https://github.com/DenisChernykh/amazing-ekb-hub-frontend/issues/17);
- нормальных `loading.tsx`/`error.tsx` для всех routes, это уже отмечено в `../frontend/docs/TODO.md`;
- синхронизации public frontend auth client с текущим backend cookie-only контрактом, если generated client в `../frontend` все еще содержит старые token request/response модели.

## Admin SPA Coverage

Текущий `admin-codex` уже закрывает инфраструктурную основу, но почти не закрывает предметные admin-фичи.

Есть:

- Vite SPA + Ant Design baseline;
- generated API + Orval;
- cookie-only Axios transport with `withCredentials`;
- refresh-once на `401`;
- NestJS-only error normalization;
- login page через AntD Form;
- protected route через `GET /auth/me`;
- logout button;
- базовый dashboard placeholder с текущим пользователем;
- admin shell с sidebar/header/navigation;
- read-only route `/places` со списком мест через `GET /admin/places`, включая `hidden`;
- URL-driven status filter для `/places`: all / active / hidden;
- read-only route `/places/:placeId` через `GET /admin/places/{placeId}`;
- status panel на `/places/:placeId` для публикации/скрытия места;
- route `/places/:placeId/edit` с формой редактирования места через `PATCH /admin/places/{placeId}` в admin `main` через merged admin PR [#4](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/4);
- cover upload panel на `/places/:placeId` в admin `main` через merged admin PR [#6](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/6): preview текущего `coverImageUrl`, локальная валидация JPEG/PNG/WebP до 5 MB, `POST /admin/places/{placeId}/photo`, success/error feedback, reset pending file при смене места;
- read-only materials panel на `/places/:placeId` в admin `main` через merged admin PR [#8](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/8); merged admin PR [#10](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/10) переключил panel на bounded `GET /admin/places/{placeId}/materials`, включая `hidden` places;
- material create/edit drawer forms on `/places/:placeId` are done in admin `main` via merged admin PR [#12](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/12): create uses `POST /admin/places/{placeId}/materials`, edit uses partial `PATCH /admin/materials/{materialId}`, edit drawer shows dirty diff chips and both drawers guard dirty close;
- pinned material selector on `/places/:placeId`: отдельная card рядом с materials panel, set/change через `PATCH /admin/places/{placeId}/pinned-material`, success/error feedback, admin detail cache invalidation;
- route `/places/new` с формой создания места через `POST /admin/places`;
- FSD baseline: `app`, `pages`, `widgets`, `features`, `entities`, `shared`;
- agent/coding docs: TSDoc, React rules, helper registry.

Не хватает:

- page titles, forbidden/empty/error standards для всех будущих разделов;
- поиск и фильтр категории в админке;
- bulk moderation workflow для массовой смены статуса мест; tracked in admin issue [#15](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/15) and Notion roadmap;
- runtime smoke загрузки/замены cover-фото с реальным backend;
- снятие pinned material, если backend позже расширит контракт nullable payload или отдельным unset endpoint; tracked in backend issue [#45](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/45) and admin follow-up [#13](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/13);
- экран или виджет проверки health/readiness;
- field-level mapping для validation errors, если backend позже отдаст структурированные поля;
- smoke/runtime сценарий с реальным backend после login/logout.

## Feature Gap Matrix

| Feature                          | Backend                                                                                                                                                                                                                                                                                                                                | Public frontend                                                                                                                             | Admin SPA                                                                                                                                                                                                                                                                                                                                                                                                                         | Gap                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Cookie auth login/logout/session | Есть                                                                                                                                                                                                                                                                                                                                   | Частично/нужно сверить с новым cookie-only контрактом                                                                                       | Есть                                                                                                                                                                                                                                                                                                                                                                                                                              | Для admin покрыто; public frontend может требовать sync  |
| Public places catalog            | Есть                                                                                                                                                                                                                                                                                                                                   | Частично есть                                                                                                                               | Не требуется                                                                                                                                                                                                                                                                                                                                                                                                                      | Нет search/filter/sort UI                                |
| Public place detail              | Есть; materials pagination cleanup merged in backend PR [#43](https://github.com/DenisChernykh/amazing-ekb-hub-backend/pull/43), closing [backend issue #28](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/28)                                                                                                       | Есть; remove `pageSize=100` workaround via [public frontend issue #17](https://github.com/DenisChernykh/amazing-ekb-hub-frontend/issues/17) | Не требуется                                                                                                                                                                                                                                                                                                                                                                                                                      | Материалы намеренно показываются полным коротким списком |
| Public cover photo               | Есть                                                                                                                                                                                                                                                                                                                                   | Есть                                                                                                                                        | Не требуется                                                                                                                                                                                                                                                                                                                                                                                                                      | Нет отдельного fallback/error UX для битых фото          |
| Favorites                        | Есть                                                                                                                                                                                                                                                                                                                                   | Нет                                                                                                                                         | Не требуется как admin фича                                                                                                                                                                                                                                                                                                                                                                                                       | Нужны favorite toggle и favorites page                   |
| Admin places list                | Есть `GET /admin/places` и `GET /admin/places/{placeId}`                                                                                                                                                                                                                                                                               | Не требуется                                                                                                                                | Есть: admin list, status filter, read-only detail shell                                                                                                                                                                                                                                                                                                                                                                           | Нужны material actions на admin detail                   |
| Admin create place               | Есть; `summary`/`tags` optional in backend PR [#41](https://github.com/DenisChernykh/amazing-ekb-hub-backend/pull/41), closing [backend issue #26](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/26)                                                                                                                 | Не требуется                                                                                                                                | Есть в admin `main`: route `/places/new`, AntD create form, validation feedback; merged admin PR [#11](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/11) removed required UI validation for `summary`/`tags` and closed admin issue [#5](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/5)                                                                                                           | Нужен runtime smoke с реальным backend                   |
| Admin update place               | Есть                                                                                                                                                                                                                                                                                                                                   | Не требуется                                                                                                                                | Есть в admin `main` через merged admin PR [#4](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/4): route `/places/:placeId/edit`, dirty guard, diff PATCH                                                                                                                                                                                                                                                             | Нужен runtime smoke с реальным backend                   |
| Admin publish/hide place         | Есть                                                                                                                                                                                                                                                                                                                                   | Не требуется                                                                                                                                | Есть: status panel на `/places/:placeId` в admin `main`                                                                                                                                                                                                                                                                                                                                                                           | Нужен runtime smoke с реальным backend                   |
| Admin bulk moderation            | Есть одиночный `PATCH /admin/places/{placeId}/status`; backend bulk endpoint не нужен для первого frontend-heavy среза                                                                                                                                                                                                                 | Не требуется                                                                                                                                | Done in admin `main` via merged admin PR [#21](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/21), closing [admin issue #15](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/15): client-side Redux workflow over the existing single-place endpoint. Future draft-selection persistence is tracked separately in [admin issue #20](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/20). | Нужен runtime smoke с реальным backend                   |
| Admin cover upload               | Есть                                                                                                                                                                                                                                                                                                                                   | Не требуется                                                                                                                                | Есть в admin `main` через merged admin PR [#6](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/6): detail panel, preview, локальная file validation, cache invalidation                                                                                                                                                                                                                                               | Нужен runtime smoke с реальным backend                   |
| Admin materials list             | Есть bounded admin read endpoint via backend PR [#43](https://github.com/DenisChernykh/amazing-ekb-hub-backend/pull/43), closing [backend issue #27](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/27) and [#28](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/28)                                 | Не требуется                                                                                                                                | Есть в admin `main` через merged admin PR [#10](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/10): read-only panel uses `GET /admin/places/{placeId}/materials`, including hidden places, with no `page/pageSize` bridge; create/edit forms are done via merged admin PR [#12](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/12)                                                                      | Нужен runtime smoke с реальным backend                   |
| Admin create/update material     | Есть                                                                                                                                                                                                                                                                                                                                   | Не требуется                                                                                                                                | Есть в admin `main` через merged admin PR [#12](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/12): AntD drawer forms, entity mutation bridges, dirty close guard, edit diff chips, cache invalidation                                                                                                                                                                                                               | Нужен runtime smoke с реальным backend                   |
| Admin pinned material            | Есть для set/change; clear/unpin не поддержан текущим OpenAPI/backend DTO, потому что `SetPinnedMaterialRequest.materialId` обязателен; tracked in backend issue [#45](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/45) and admin follow-up [#13](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/13) | Показывается в detail                                                                                                                       | Есть set/change selector на `/places/:placeId` рядом с materials panel                                                                                                                                                                                                                                                                                                                                                            | Для clear/unpin нужен backend contract                   |
| Health/readiness                 | Есть                                                                                                                                                                                                                                                                                                                                   | Нет                                                                                                                                         | Нет                                                                                                                                                                                                                                                                                                                                                                                                                               | Опционально: service status widget                       |

## Backend Gaps For Admin UX

Эти пункты не блокируют первый admin UI, но могут стать ограничениями:

1. Нет удаления места и удаления материала.
   - В MVP заявлено “скрытие”, поэтому delete может быть не нужен сейчас.
   - Для материалов есть create/update, но нет soft delete/hide.

2. Нет отдельного статуса материала.
   - Если материалы должны скрываться без удаления, backend contract надо расширять.

3. Favorites API не имеет явной пагинации в OpenAPI endpoint table.
   - Перед UI избранного надо проверить response contract и UX ожидания.

4. Admin read endpoint для материалов hidden places готов.
   - Backend PR [#43](https://github.com/DenisChernykh/amazing-ekb-hub-backend/pull/43) добавил `GET /admin/places/{placeId}/materials`, закрыл [backend issue #27](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/27) и [backend issue #28](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/28).
   - Merged admin PR [#10](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/10) переключил read-only panel на bounded admin endpoint.

## Recommended Admin Roadmap

### Phase 1: Admin Shell And Places List

- Ввести admin layout: sidebar, header, content outlet.
- Добавить route `/places`.
- Подключить список мест с pagination/search/category/status-aware UI.
- Done: backend PR [#25](https://github.com/DenisChernykh/amazing-ekb-hub-backend/pull/25) добавил `GET /admin/places` и `GET /admin/places/{placeId}`.
- Done: admin SPA переключает `/places` на `GET /admin/places`, поддерживает status filter и read-only detail route `/places/:placeId`.

### Phase 2: Place Editor

- Status: create, edit, status, and cover upload slices are done in admin `main`; edit form landed via merged admin PR [#4](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/4), cover upload landed via merged admin PR [#6](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/6). Backend PR [#41](https://github.com/DenisChernykh/amazing-ekb-hub-backend/pull/41) made `summary` and `tags` optional; merged admin PR [#11](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/11) completed the admin UI follow-up and closed [admin issue #5](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/5).
- Добавить create form для `title`, `summary`, `tags`, `category`, `popularityWeight`. Done: route `/places/new`, AntD Form, category options, create mutation bridge, list invalidation, success/error feedback.
- Добавить edit form для `title`, `summary`, `tags`, `category`, `popularityWeight`. Done in merged admin PR [#4](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/4): route `/places/:placeId/edit`, partial diff payload, reset to server values, dirty navigation blocker.
- Добавить status action `active/hidden`. Done: detail status panel with `EyeOutlined` / `EyeInvisibleOutlined`, explicit explanation, submit state, success/error feedback.
- Подключить validation errors к AntD Form.

### Phase 3: Cover Photo

- Status: done in admin `main` via merged admin PR [#6](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/6); runtime smoke remains open.

- Добавить upload control для JPEG/PNG/WebP до 5 MB.
- Показывать preview текущего `coverImageUrl`.
- Обрабатывать `400` validation array как form/global error.

### Phase 4: Materials Management

- Status: first read-only materials panel is done in admin `main` via merged admin PR [#8](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/8). Backend bounded materials read is done via merged backend PR [#43](https://github.com/DenisChernykh/amazing-ekb-hub-backend/pull/43), closing backend issue [#27](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/27) and [#28](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/28). Admin PR [#10](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/10) is merged to `main`: generated client is synced and the panel uses `GET /admin/places/{placeId}/materials`; tracked admin issue [#7](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/7) is closed. Create/update material forms are done in admin `main` via merged admin PR [#12](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/12).

- Добавить materials tab на странице места.
- Реализовать create/update material forms. Done in admin `main` via merged admin PR [#12](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/12): AntD Drawer, dirty close guard, edit diff chips, partial PATCH payload, materials/detail cache invalidation.
- Поддержать `platform`, `type`, `title`, `publishedAt`, `durationSec`, `url`.

### Phase 5: Pinned Material

- Status: set/change selector is implemented on admin detail. Clear/unpin is explicitly blocked until backend exposes a nullable payload, delete/unset endpoint, or documented equivalent; backend issue [#45](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/45), admin follow-up [#13](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/13).
- Selector существующего материала места: отдельная card рядом с materials panel, использует уже загруженный bounded список материалов.
- `PATCH /admin/places/{placeId}/pinned-material`: подключен через entity mutation bridge, UI не импортирует generated hooks напрямую.
- Текущий pinned material показывается в админке; submit disabled, пока выбранный material не отличается от сохраненного.

### Phase 6: Bulk Moderation Workflow

- Status: done in admin `main` via merged admin PR [#21](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/21), which closed admin issue [#15](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/15). This is an intentional Learning / Frontend architecture slice for Redux Toolkit.
- Scope: bulk status moderation for admin places only, using `active` / `hidden`.
- Backend blocker: none for the first slice. Admin already has single-place `PATCH /admin/places/{placeId}/status`; the frontend intentionally orchestrates a batch over that endpoint.
- Implementation: Redux Toolkit stores selection across pages, local operation queue, per-item progress, partial errors, retry metadata, and undo metadata; `/places` uses Ant Design table row selection, compact toolbar, and progress drawer.
- State ownership: Redux Toolkit stores in-memory selection, operation queue, per-item progress, retry/undo metadata; React Query remains the source of truth for server data.
- Reload/browser close resets selection, queue, progress, and undo metadata in v1.
- Non-goals: no bulk delete, no material bulk actions, no backend bulk endpoint, no persistence in this slice.
- Acceptance: selection across pages, operation progress, partial failures, retry failed items, undo through reverse status updates, and no regression in the existing single-place status flow. Final verification passed on the merged `main` branch.
- Future follow-up: persist only draft selection through `sessionStorage` with a short TTL, restore prompt, and clear rules; tracked in [admin issue #20](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/20). Active queue, progress, and undo must not be persisted.

### Phase 7: Public Frontend Gaps

- Добавить search/filter/sort controls на главную.
- Добавить favorites toggle и страницу “Избранное”.
- Убрать устаревший paginated materials workaround после backend PR [#43](https://github.com/DenisChernykh/amazing-ekb-hub-backend/pull/43) через [public frontend issue #17](https://github.com/DenisChernykh/amazing-ekb-hub-frontend/issues/17).
- Сверить public frontend generated auth client с новым backend cookie-only контрактом.

## Open Decisions

1. Нужна ли админке возможность видеть и редактировать `hidden` places через отдельные admin read endpoints?
2. Нужна ли pagination/incremental loading для материалов места? Current answer: no; backend PR [#43](https://github.com/DenisChernykh/amazing-ekb-hub-backend/pull/43) closed [backend issue #28](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/28), admin sync is done via merged admin PR [#10](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/10), downstream public sync remains in [public frontend issue #17](https://github.com/DenisChernykh/amazing-ekb-hub-frontend/issues/17).
3. Нужен ли отдельный admin read endpoint для материалов hidden places? Current answer: yes; backend PR [#43](https://github.com/DenisChernykh/amazing-ekb-hub-backend/pull/43) closed [backend issue #27](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/27), admin sync is done via merged admin PR [#10](https://github.com/DenisChernykh/amazing-ekb-hub-admin/pull/10).
4. Нужны ли delete/soft-delete для материалов или достаточно update + скрытие места?
5. Нужно ли backend расширение для снятия pinned material, или set/change достаточно для MVP? Backend follow-up: [#45](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/45), admin follow-up: [#13](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/13).
6. Нужен ли backend bulk endpoint для массовой смены статуса мест? Current answer: no for the first learning slice; client-side orchestration over `PATCH /admin/places/{placeId}/status` is intentional, tracked in admin issue [#15](https://github.com/DenisChernykh/amazing-ekb-hub-admin/issues/15).
7. Должно ли избранное быть частью публичного MVP сейчас или остается optional?
8. Нужна ли отдельная роль editor/moderator позже, или `admin/user` достаточно для ближайших фаз?
9. Должна ли админка иметь operational health page, или health endpoints остаются только для инфраструктуры?
