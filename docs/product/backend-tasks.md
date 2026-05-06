# Backend Tasks

Документ фиксирует доработки, которые frontend/admin SPA не должна обходить локальными костылями. Эти задачи нужно передавать в backend как отдельные contract changes.

## Admin Places Read Model

**Status:** Реализовано в backend PR [#25](https://github.com/DenisChernykh/amazing-ekb-hub-backend/pull/25), backend issue [#23](https://github.com/DenisChernykh/amazing-ekb-hub-backend/issues/23) закрыт.

**Frontend context:** admin SPA должна читать список и detail мест через admin endpoints, чтобы hidden places не пропадали из управления.

**Problem:** публичный `GET /places` предназначен для витрины и может отдавать только `active` места. После скрытия места через admin action оно может исчезнуть из публичного списка, и админка потеряет возможность найти и вернуть его обратно.

**Backend result:** добавлены admin read endpoints для мест.

Минимальный contract:

- `GET /admin/places`
  - требует `admin` auth;
  - возвращает пагинированный список мест, включая `active` и `hidden`;
  - поддерживает `page`, `pageSize`;
  - поддерживает фильтр по `status`, чтобы админ мог смотреть только опубликованные или только скрытые места;
  - может переиспользовать текущий `PlaceSummary`, если для первой версии не нужны дополнительные admin-only поля.

Желательный следующий endpoint:

- `GET /admin/places/{placeId}`
  - требует `admin` auth;
  - возвращает detail места независимо от public visibility;
  - нужен для будущей формы редактирования hidden places.

**Acceptance criteria:**

- hidden place доступен в `GET /admin/places`;
- public `GET /places` продолжает отдавать только public-safe каталог;
- OpenAPI spec обновлен;
- generated frontend client после sync получает admin read methods;
- текущие admin mutations `/admin/places/*` остаются совместимыми.

**Frontend follow-up after backend:** переключить `usePlacesListQuery` с публичного `GET /places` на `GET /admin/places`, добавить status filter в admin UI и использовать `GET /admin/places/{placeId}` для admin detail/edit/status/photo/material screens.
