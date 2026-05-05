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

| API                               | Возможность                                       | Основные поля/параметры                                                  | Текущий UI coverage                                                         |
| --------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `GET /places`                     | Пагинированный список активных мест               | `page`, `pageSize`, `search`, `category`, `sort=popular`; `PlaceSummary` | Частично есть в public frontend: список, карточки, пагинация                |
| `GET /places/{placeId}`           | Детальная карточка места                          | `PlaceDetail`, `pinnedMaterial`, counters by platform                    | Есть в public frontend detail page                                          |
| `GET /places/{placeId}/photo`     | Публичная выдача cover-фото                       | binary stream                                                            | Используется через `coverImageUrl` в public frontend                        |
| `GET /places/{placeId}/materials` | Материалы места с пагинацией и фильтром платформы | `page`, `pageSize`, `platform`; `MaterialListResponse`                   | Частично есть в public frontend: detail page грузит материалы по платформам |

### Favorites

| API                           | Возможность                        | Auth        | Текущий UI coverage |
| ----------------------------- | ---------------------------------- | ----------- | ------------------- |
| `GET /favorites`              | Список избранных мест пользователя | cookie auth | Не покрыто UI       |
| `POST /favorites/{placeId}`   | Добавить место в избранное         | cookie auth | Не покрыто UI       |
| `DELETE /favorites/{placeId}` | Удалить место из избранного        | cookie auth | Не покрыто UI       |

Favorites реализованы на backend, но в публичном frontend пока нет пользовательского сценария избранного.

### Admin Content Management

| API                                             | Возможность                                              | Auth    | Текущий UI coverage          |
| ----------------------------------------------- | -------------------------------------------------------- | ------- | ---------------------------- |
| `POST /admin/places`                            | Создать место                                            | `admin` | Есть create form в admin SPA |
| `PATCH /admin/places/{placeId}`                 | Редактировать место                                      | `admin` | Не покрыто admin UI          |
| `PATCH /admin/places/{placeId}/status`          | Скрыть/опубликовать место через `active/hidden`          | `admin` | Не покрыто admin UI          |
| `POST /admin/places/{placeId}/photo`            | Загрузить или заменить cover-фото, JPEG/PNG/WebP до 5 MB | `admin` | Не покрыто admin UI          |
| `POST /admin/places/{placeId}/materials`        | Создать материал для места                               | `admin` | Не покрыто admin UI          |
| `PATCH /admin/materials/{materialId}`           | Редактировать материал                                   | `admin` | Не покрыто admin UI          |
| `PATCH /admin/places/{placeId}/pinned-material` | Назначить pinned material для блока “Начни отсюда”       | `admin` | Не покрыто admin UI          |

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
- “Показать еще” для материалов на detail page: сейчас detail грузит до `100` материалов на платформу и рендерит список без incremental pagination;
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
- read-only route `/places` со списком активных мест через `GET /places`;
- route `/places/new` с формой создания места через `POST /admin/places`;
- FSD baseline: `app`, `pages`, `widgets`, `features`, `entities`, `shared`;
- agent/coding docs: TSDoc, React rules, helper registry.

Не хватает:

- page titles, forbidden/empty/error standards для всех будущих разделов;
- полноценный список мест для админа, включая `hidden`;
- фильтры/поиск мест в админке;
- форма редактирования места;
- действие публикации/скрытия места;
- загрузка/замена cover-фото;
- список материалов места;
- форма создания материала;
- форма редактирования материала;
- назначение pinned material;
- экран или виджет проверки health/readiness;
- UX для validation errors в AntD Form;
- smoke/runtime сценарий с реальным backend после login/logout.

## Feature Gap Matrix

| Feature                          | Backend                                                                     | Public frontend                                       | Admin SPA                                                        | Gap                                                                         |
| -------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Cookie auth login/logout/session | Есть                                                                        | Частично/нужно сверить с новым cookie-only контрактом | Есть                                                             | Для admin покрыто; public frontend может требовать sync                     |
| Public places catalog            | Есть                                                                        | Частично есть                                         | Не требуется                                                     | Нет search/filter/sort UI                                                   |
| Public place detail              | Есть                                                                        | Есть                                                  | Не требуется                                                     | Нет incremental “Показать еще”                                              |
| Public cover photo               | Есть                                                                        | Есть                                                  | Не требуется                                                     | Нет отдельного fallback/error UX для битых фото                             |
| Favorites                        | Есть                                                                        | Нет                                                   | Не требуется как admin фича                                      | Нужны favorite toggle и favorites page                                      |
| Admin places list                | API можно читать через `GET /places`, но отдельного admin list endpoint нет | Не требуется                                          | Частично: read-only active places list                           | Нужен backend endpoint для просмотра hidden places                          |
| Admin create place               | Есть                                                                        | Не требуется                                          | Есть: route `/places/new`, AntD create form, validation feedback | Нужен runtime smoke с реальным backend                                      |
| Admin update place               | Есть                                                                        | Не требуется                                          | Нет                                                              | Нужна форма редактирования                                                  |
| Admin publish/hide place         | Есть                                                                        | Не требуется                                          | Нет                                                              | Нужны status controls                                                       |
| Admin cover upload               | Есть                                                                        | Не требуется                                          | Нет                                                              | Нужен upload UI и preview                                                   |
| Admin materials list             | Есть public list by place                                                   | Не требуется                                          | Нет                                                              | Нужен admin materials tab; возможно нужен доступ к материалам hidden places |
| Admin create/update material     | Есть                                                                        | Не требуется                                          | Нет                                                              | Нужны формы материала                                                       |
| Admin pinned material            | Есть                                                                        | Показывается в detail                                 | Нет                                                              | Нужен selector/action в админке                                             |
| Health/readiness                 | Есть                                                                        | Нет                                                   | Нет                                                              | Опционально: service status widget                                          |

## Backend Gaps For Admin UX

Эти пункты не блокируют первый admin UI, но могут стать ограничениями:

1. Нет отдельного `GET /admin/places`.
   - Админке нужен список всех мест, включая `hidden`.
   - Если `GET /places` отдает только публичные/active места, админка не сможет управлять скрытыми местами после hide.
   - Backend handoff: `docs/product/backend-tasks.md#admin-places-read-model`, GitHub issue [#23](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/23).

2. Нет отдельного `GET /admin/places/{placeId}`.
   - Для редактирования hidden place может понадобиться admin detail endpoint.
   - Backend handoff: `docs/product/backend-tasks.md#admin-places-read-model`, GitHub issue [#23](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/23).

3. Нет удаления места и удаления материала.
   - В MVP заявлено “скрытие”, поэтому delete может быть не нужен сейчас.
   - Для материалов есть create/update, но нет soft delete/hide.

4. Нет отдельного статуса материала.
   - Если материалы должны скрываться без удаления, backend contract надо расширять.

5. Favorites API не имеет явной пагинации в OpenAPI endpoint table.
   - Перед UI избранного надо проверить response contract и UX ожидания.

## Recommended Admin Roadmap

### Phase 1: Admin Shell And Places List

- Ввести admin layout: sidebar, header, content outlet.
- Добавить route `/places`.
- Подключить список мест с pagination/search/category/status-aware UI.
- Если backend не умеет отдавать hidden places, завести backend task на `GET /admin/places`.

### Phase 2: Place Editor

- Status: create place slice done in admin SPA branch `codex/admin-create-place`; edit/status slices remain open.
- Добавить create form для `title`, `summary`, `tags`, `category`, `popularityWeight`. Done: route `/places/new`, AntD Form, category options, create mutation bridge, list invalidation, success/error feedback.
- Добавить edit form для `title`, `summary`, `tags`, `category`, `popularityWeight`.
- Добавить status action `active/hidden`.
- Подключить validation errors к AntD Form.

### Phase 3: Cover Photo

- Добавить upload control для JPEG/PNG/WebP до 5 MB.
- Показывать preview текущего `coverImageUrl`.
- Обрабатывать `400` validation array как form/global error.

### Phase 4: Materials Management

- Добавить materials tab на странице места.
- Реализовать create/update material forms.
- Поддержать `platform`, `type`, `title`, `publishedAt`, `durationSec`, `url`.

### Phase 5: Pinned Material

- Добавить selector существующего материала места.
- Подключить `PATCH /admin/places/{placeId}/pinned-material`.
- Показывать в админке, какой материал сейчас закреплен.

### Phase 6: Public Frontend Gaps

- Добавить search/filter/sort controls на главную.
- Добавить favorites toggle и страницу “Избранное”.
- Добавить incremental “Показать еще” для материалов.
- Сверить public frontend generated auth client с новым backend cookie-only контрактом.

## Open Decisions

1. Нужна ли админке возможность видеть и редактировать `hidden` places через отдельные admin read endpoints?
2. Нужны ли delete/soft-delete для материалов или достаточно update + скрытие места?
3. Должно ли избранное быть частью публичного MVP сейчас или остается optional?
4. Нужна ли отдельная роль editor/moderator позже, или `admin/user` достаточно для ближайших фаз?
5. Должна ли админка иметь operational health page, или health endpoints остаются только для инфраструктуры?
