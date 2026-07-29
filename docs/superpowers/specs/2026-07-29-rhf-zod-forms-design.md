# RHF + Zod Forms Migration Design

## Статус документа

Дата: 2026-07-29.

Design утверждён в диалоге до записи этого документа. Решение разработано
независимо: существующий GitHub issue о формах не использовался как источник
требований или архитектуры.

## Контекст

Административное Vite SPA использует Ant Design 6 как UI-библиотеку. Десять
пользовательских form-flow сейчас используют AntD `Form` как хранилище
значений, механизм submit, dirty tracking и validation engine.

В проекте уже установлены:

- `react-hook-form`;
- Zod 4;
- Orval, который из локального `openapi.yaml` генерирует API-клиент и
  operation-level Zod-схемы в `src/shared/api/generated-zod`.

`openapi.yaml` синхронизируется из committed specification соседнего
`backend-codex`, а не из production endpoint. Из временного admin worktree
paired backend вычисляется относительно primary admin worktree; иной локальный
checkout можно передать через `OPENAPI_SPEC_SOURCE`.

Текущая OpenAPI Zod-генерация описывает транспортный контракт, но не всю
семантику пользовательского ввода. Например, обязательное OpenAPI-свойство
типа `string` становится `z.string()` и принимает пустую строку, если в
OpenAPI нет `minLength`. Некоторые UI-значения также намеренно отличаются от
payload:

- AntD `DatePicker` работает с `Dayjs`, а API принимает `YYYY-MM-DD`;
- необязательное поле в форме очищается до `''`, а API может ожидать отсутствие
  свойства или `null`;
- edit-форма содержит полное состояние сущности, а API принимает частичный
  `PATCH`;
- применимость `durationSec` зависит от выбранного типа материала;
- существующие helper-ы нормализуют пробелы, URL, теги и cleared values.

Поэтому generated request schemas нельзя сделать единственными top-level
form schemas без изменения поведения или сложной обратной трансформации.

## Цель

Атомарно перевести все пользовательские формы с AntD form store на React Hook
Form с Zod resolver, сохранить AntD как визуальный слой и сохранить текущее
пользовательское и API-поведение.

В итоговой feature-ветке не должно остаться двух конкурирующих механизмов
управления формами.

## Не входит в scope

- изменение backend или `openapi.yaml`;
- ручное редактирование generated API/Zod-файлов;
- изменение API payload или mutation/cache contracts;
- раскладывание backend validation errors по отдельным RHF-полям;
- изменение текстов server error alerts;
- перенос cover-файла внутрь RHF;
- новый пользовательский flow или редизайн форм;
- новые e2e-тесты;
- новые integration-тесты без реально нового межмодульного взаимодействия;
- добавление агрегирующего `pnpm check` script;
- изменение `react-starter` в рамках этой ветки;
- push, создание PR, merge или deployment;
- использование существующего GitHub issue как спецификации.

## Инвентарь миграции

Миграция охватывает десять form-flow.

| Область        | Flow   | Сохраняемое поведение                                                                        |
| -------------- | ------ | -------------------------------------------------------------------------------------------- |
| Auth           | Login  | session mutation, API error message, очистка bulk moderation draft, callback успешного входа |
| Category       | Create | backend-generated slug, guarded drawer close, reset после успеха                             |
| Category       | Edit   | обязательный slug, normalized dirty state, changed-field chips, partial PATCH                |
| Content source | Create | platform и HTTP URL validation, optional identity fields, guarded close                      |
| Content source | Edit   | locked identity semantics, explicit `null` clears, normalized dirty state, partial PATCH     |
| Material       | Create | `Dayjs` date, conditional duration, normalized URL, guarded close                            |
| Material       | Edit   | conditional duration cleanup, changed-field chips, partial PATCH                             |
| Place          | Create | category query, optional slug/tags/summary, отдельная cover upload mutation, partial success |
| Place          | Edit   | normalized dirty state, reset, partial PATCH, внешний navigation blocker                     |
| Yandex import  | Start  | HTTP URL validation, active-import recovery, structured `409` resume                         |

`PlaceCoverDraftPicker` использует `Form.Item` как layout wrapper, но не
является одиннадцатым form-flow. Файл остаётся application-managed state,
потому что выбор можно отменить и cover загружается отдельным multipart
запросом после создания места.

## Архитектурное решение

Выбран гибридный вариант:

1. Generated Zod-схемы из OpenAPI остаются источником транспортных
   ограничений.
2. Feature-level Zod-схемы описывают UI-значения и пользовательскую
   валидацию.
3. Существующие payload builders остаются границей form values → API request.
4. Unit-тесты payload builders доказывают, что собранный request принимается
   соответствующей generated request schema.

### Почему не generated-only

Generated-only вариант не покрывает без дополнительных адаптеров:

- непустые trimmed strings;
- `''` как UI-представление cleared optional field;
- `Dayjs`;
- create/edit-различия;
- conditional fields;
- full form state → partial PATCH.

Если заставить resolver сразу возвращать request payload, edit-flow потеряет
полное состояние, необходимое для dirty comparison и changed-field chips.

### Почему не handwritten-only

Полностью ручные form schemas удобны для UI, но дублируют enum, pattern, URL,
date и required contracts из OpenAPI. Это создаёт независимый источник
ограничений и риск drift.

### Правило композиции

Feature schema переиспользует generated field schema через `*Body.shape`,
когда UI и API используют одинаковое runtime-представление.

Примеры подходящих полей:

- email;
- enum платформы или типа;
- category identifier;
- slug pattern после адаптации empty-value семантики;
- URL как базовый формат.

Feature schema заменяет или дополняет generated field schema, когда UI
представление отличается:

- добавляет `trim()` и непустое значение;
- допускает `''` для optional input;
- использует `Dayjs` вместо ISO date string;
- проверяет только `http`/`https`, а не произвольный URL scheme;
- добавляет conditional refinement для duration;
- задаёт отдельные create/edit requirements.

Generated schema не копируется целиком вручную и не изменяется.

## Размещение form schemas и типов

Схемы располагаются в model-части соответствующей feature:

```text
src/features/auth/login/model/
src/features/category/form/model/
src/features/content-source/form/model/
src/features/material/form/model/
src/features/place/form/model/
src/features/place/import-yandex/model/
```

Для доменов с общей create/edit-формой используется базовая UI shape и две
явные operation schemas. Create/edit schema могут переиспользовать базовую
shape, но не должны скрывать различающиеся requirements.

Form value types выводятся из Zod schemas. В местах с transforms React Hook
Form различает:

- `z.input<TSchema>` — значения, которые хранят UI controls и `useWatch`;
- `z.output<TSchema>` — значения, которые получает успешный submit handler.

Все controlled fields получают явные `defaultValues`. `undefined` не
используется как default или cleared value:

- text input: `''`;
- nullable number/date: `null`;
- tags: `[]`;
- select без значения: `null`; required feature schema отклоняет `null` при
  submit и после пользовательского изменения.

## Русская локаль Zod

Создаётся side-effect модуль:

```text
src/shared/config/zod-locale.ts
```

Он импортирует `ru` из `zod/locales` и выполняет `z.config(ru())`.

Модуль подключается:

- первым application-side-effect импортом из `src/main.tsx`;
- из `src/test/setup.ts`.

Это гарантирует одинаковую локаль runtime и component tests до первого
`parse`, `safeParse` или resolver validation.

Built-in locale служит fallback для стандартных ошибок. Текущие
пользовательские сообщения вроде «Введите название» или подсказки формата slug
остаются явными schema messages. Component tests проверяют точный
пользовательский текст, а не только наличие alert/error container.

Generated-файлы не импортируют locale initializer и не редактируются.

## Общий RHF-слой

### `useZodForm`

В `src/shared/lib/form/use-zod-form.ts` создаётся тонкий generic hook, который:

- принимает Zod schema;
- принимает обычные `UseFormProps`, кроме возможности заменить resolver;
- вызывает `useForm<z.input<TSchema>, unknown, z.output<TSchema>>`;
- подключает `zodResolver(schema)`;
- возвращает стандартный `UseFormReturn`.

Hook не скрывает submit handler, reset, watch, server errors или mutation
behavior и не задаёт validation mode. Каждая admin-форма явно передаёт
`mode: 'onChange'` и `reValidateMode: 'onChange'`, чтобы сохранить текущий
AntD `validateTrigger` behavior. Эта UX policy не зашивается в переносимый
между проектами hook.

Hook документируется на русском TSDoc и добавляется в helper registry.

После успешного использования во всех admin forms готовится отдельное
предложение для `react-starter`:

- контракт hook;
- доказанные use cases;
- ограничения input/output generics;
- рекомендация перенести отдельной задачей.

Эта feature-ветка не изменяет `react-starter`.

### `RhfFormItem`

В `src/shared/ui/form/rhf-form-item.tsx` создаётся AntD-specific adapter.

Он связывает `useController`/`Controller` field state с:

- `Form.Item` label и vertical layout;
- `help`;
- `validateStatus="error"`;
- control `status="error"`, где такой prop поддерживается;
- `htmlFor`, `id`, `aria-invalid` и error description.

Adapter предоставляет render prop для конкретного AntD control и не пытается
унифицировать разные `onChange` signatures через небезопасные assertions.

`RhfFormItem` остаётся только в admin-проекте: `react-starter` использует другой
UI foundation, поэтому AntD adapter туда не предлагается.

## UI composition

Каждый flow использует:

```text
FormProvider
└── native <form noValidate onSubmit={handleSubmit(...)}>
    ├── RhfFormItem / presentational Form.Item
    ├── AntD controls
    ├── existing API error alert
    └── existing action buttons
```

AntD остаётся визуальным слоем:

- `Input`;
- `Input.Password`;
- `Select`;
- `DatePicker`;
- `InputNumber`;
- `Button`;
- `Form.Item` только как presentation/layout primitive.

Удаляются:

- top-level AntD `Form` store;
- `Form.useForm`;
- `form` instance methods;
- `Form.Item name`;
- `rules`;
- `onFinish`;
- `onValuesChange`.

`Form.Item` без form store получает явный `layout="vertical"` там, где это
нужно для сохранения текущего layout.

## Submit data flow

Happy path:

```text
AntD control
→ RHF field
→ feature Zod schema through zodResolver
→ normalized successful form output
→ existing toCreate*/toUpdate* request builder
→ existing entity mutation hook
→ existing API client
→ backend
```

Generated schema участвует:

- как building block feature validation;
- как request-contract assertion в payload builder unit tests.

Production submit не делает второй generated `parse` после успешного resolver,
потому что неожиданный `ZodError` между UI и mutation превратился бы в
неподходящую generic API error presentation. Contract drift доказывается
focused unit tests и TypeScript.

## Dirty state, reset и changed fields

RHF `formState.isDirty` применяется только там, где raw-value comparison
совпадает с текущим поведением.

Create drawers могут использовать RHF dirty state для защиты от случайного
закрытия после любого пользовательского изменения.

Edit flows сохраняют существующую normalized semantics:

- значения читаются через `useWatch`;
- `has*FormChanges(values, initialValues)` определяет product-level dirty
  state;
- `get*FormChangedFields(values, initialValues)` вычисляет chips во время
  render;
- отдельное React state для changed-field list удаляется;
- reset вызывает RHF `reset(initialValues)`.

Так пробелы, cleared optional values, теги, dates и disabled duration
сравниваются так же, как до миграции.

### Navigation blocker

`EditPlaceForm` сообщает dirty state внешнему widget, который блокирует
навигацию. Для этого используется один `useEffect`, вызывающий
`onDirtyChange` при изменении вычисленного normalized dirty state.

Этот effect синхронизирует RHF form state с внешней navigation-blocking
системой. В коде должно быть объяснено:

- какая внешняя система синхронизируется;
- почему derived render value недостаточно для callback;
- почему dependency semantics безопасна;
- почему отдельный cleanup не нужен: owning widget и form размонтируются
  вместе, а reset/success публикуют `false` до продолжения flow.

Другие новые `useEffect` в миграции не планируются.

## Особые flow

### Login

Login становится эталонной простой формой:

- generated `LoginBody` задаёт email/password transport shape;
- feature schema добавляет непустой password и точные русские сообщения;
- mutation callbacks и bulk moderation draft cleanup не меняются.

### Material date и duration

Material form schema валидирует `Dayjs` как UI type. Payload builder продолжает
сериализовать дату в `YYYY-MM-DD` без UTC shift.

Duration:

- разрешена только для `reel` и `video`;
- отключённое поле не участвует в changed-field chips;
- переход к типу без duration сохраняет существующий explicit `null` cleanup
  в update payload.

### Place create и cover

Cover file остаётся в локальном application state. RHF управляет только JSON
полями места.

Сохраняется последовательность:

1. создать место;
2. при наличии файла загрузить cover;
3. при успехе перейти к месту;
4. если место создано, а upload упал, показать существующий partial-success
   state и не повторять create.

### Yandex import

Start form использует feature URL schema, но сохраняет актуальное поведение
ветки `stage`:

- при входе сначала проверяется active operation;
- structured `409 active_place_import_exists` восстанавливает существующий
  `operationId`;
- прочие ошибки отображаются прежним способом.

## Error handling

Ошибки разделяются по границе:

- Zod/RHF field errors отображаются рядом с контролом;
- mutation/backend errors продолжают проходить через `normalizeApiError`;
- существующие form-level Alert и AntD message сохраняются;
- partial-success остаётся отдельным UI state.

Backend field errors не преобразуются в `setError` в этой миграции. Это
изменило бы presentation contract и потребовало отдельного дизайна стабильного
pointer-to-field mapping.

При новом submit существующие form-level API errors очищаются в тех же точках,
что и сейчас.

## Accessibility

Для каждого field:

- label связан с control через `htmlFor`/`id`;
- invalid control получает `aria-invalid`;
- error text доступен через description relationship;
- submit остаётся нативным submit;
- disabled/pending behavior сохраняется;
- focus management не ухудшается.

Точные accessibility contracts общего adapter покрываются focused component
tests.

## Тестовая стратегия

Задача является внутренним frontend-refactoring с сохранением поведения.

### Во время реализации

Запускаются только focused tests непосредственно изменяемого кода:

- schema/model unit test;
- payload builder unit test;
- общий RHF adapter component test;
- component test текущей формы.

После каждого домена не запускаются:

- полный `pnpm run test`;
- полный typecheck;
- полный lint;
- build;
- весь финальный verification bundle.

Новые e2e-тесты не добавляются.

Новый integration test допустим только если одновременно:

1. действительно изменилось взаимодействие модулей;
2. его нельзя надёжно доказать unit/component test;
3. test не дублирует уже доказанное поведение.

Такого нового взаимодействия текущий design не вводит, поэтому новые
integration tests не ожидаются.

### Combined review и fix wave

После реализации всех десяти flow проводится один combined review всей ветки.

Review проверяет:

- полноту form inventory;
- отсутствие AntD form store;
- schema composition и OpenAPI alignment;
- dirty/reset/PATCH behavior;
- exact validation copy;
- accessibility;
- React guidelines и отсутствие лишних effects;
- TSDoc;
- helper registry;
- отсутствие ручных правок generated files;
- тестовое покрытие изменённого поведения.

Minor findings не исправляются по одному. Они накапливаются и вместе с
остальными findings исправляются одной общей fix wave.

Critical и Important findings исправляются раньше только тогда, когда они
блокируют дальнейшую реализацию. Иначе они также входят в общую fix wave.

После fix wave допускается максимум один пакетный re-review всей реализации.
Отдельных spec-review, quality-review и re-review для каждого домена нет.

### Финальная проверка

Только после:

1. завершения всех форм;
2. combined review;
3. общей fix wave;
4. пакетного re-review, если он потребовался;

последовательно запускаются существующие проектные проверки:

```bash
pnpm run typecheck
pnpm run lint:strict
pnpm run test
pnpm run format:check
pnpm run build
```

Новый `check` script не добавляется.

Если проверка падает:

1. запускается только упавший script или test file;
2. проблема исправляется;
3. focused command должен пройти;
4. после этого весь финальный набор запускается повторно.

Существующие полные integration/e2e suites отдельно не запускаются. Если они
в будущем войдут в одну из проектных команд, их первый плановый полный запуск
происходит только в финале. После падения сначала повторяется только упавший
сценарий.

## Git и рабочая среда

Текущая утверждённая рабочая база:

- repository: `DenisChernykh/amazing-ekb-hub-admin`;
- base branch: `origin/stage`;
- base commit: `dc8e3475857748fdcb3c6da7f67d964da0c86180`;
- feature branch: `refactor/rhf-zod-forms`;
- isolated worktree: `/private/tmp/admin-codex-rhf-zod-forms`.

Design-spec, implementation plan и реализация живут в одной feature-ветке.
Текущий основной checkout `stage` не используется для изменений.

Push и PR не входят в автоматически разрешённый scope.

## Оркестрация субагентов

Подробный implementation plan позволяет использовать более слабую модель без
потери архитектурного контекста.

### Модели

- implementers: `gpt-5.6-terra`, reasoning `high`;
- combined reviewer: `gpt-5.6-terra`, reasoning `xhigh`;
- frontier escalation: `gpt-5.6-sol`, reasoning `high`, только при
  повторяющемся архитектурном или TypeScript generic blocker.

### Последовательность

1. Foundation/login implementer создаёт locale, resolver integration,
   `useZodForm`, `RhfFormItem` и эталонный flow.
2. После стабильного shared contract параллельно выполняются независимые
   доменные срезы:
   - category + content source;
   - material;
   - place + cover integration.
3. Yandex import и cross-project integration выполняются после shared/domain
   slices.
4. Один combined reviewer проверяет полный diff.
5. Findings исправляются одной fix wave.
6. При необходимости проводится один combined re-review.
7. Главный агент запускает финальные проверки и читает их полный вывод.

Параллельные implementers не изменяют одни и те же shared files.
Helper registry, общие exports и итоговая документация назначаются одному
integration owner.

Пользовательские ограничения review имеют приоритет над стандартным
per-task-review процессом: отдельного reviewer loop на каждую форму нет.

## Риски и меры

### Generated schema слишком слабая для UI

Мера: использовать её как transport building block, а UX-ограничения
формулировать явно в feature schema.

### Generated schema и UI используют разные runtime types

Мера: не заставлять generated schema принимать `Dayjs` или UI empty values;
проверять итоговый payload generated schema в unit tests.

### RHF raw dirty отличается от normalized product dirty

Мера: сохранить существующие normalization helpers и вычислять edit dirty/chips
из `useWatch`.

### Generic adapter скрывает несовместимые AntD signatures

Мера: render prop и явное wiring каждого control; запрет небезопасных generic
casts.

### Русская локаль подключается слишком поздно

Мера: отдельный side-effect import в application entry и test setup; exact
message regression tests.

### Параллельные агенты конфликтуют в shared files

Мера: foundation завершается до domain slices; shared integration имеет одного
owner.

### Рефакторинг незаметно меняет server error UX

Мера: оставить существующие Alerts/messages и не вводить backend `setError`
mapping.

## Критерии приёмки

1. Все десять form-flow используют RHF и Zod resolver.
2. AntD form store, `Form.useForm`, `rules`, `onFinish` и `onValuesChange`
   удалены из этих flow.
3. `Form.Item` используется только как presentation primitive.
4. Zod `ru` настроен до первой runtime/test validation.
5. Generated request schemas переиспользуются и не редактируются вручную.
6. UI schemas сохраняют точные русские сообщения и текущую normalization
   semantics.
7. Create/edit payload builders сохраняют контракты и проходят generated
   request schema assertions.
8. Dirty close, reset, changed-field chips и partial PATCH работают как до
   миграции.
9. Place cover partial-success и Yandex active-import recovery не изменены.
10. Backend errors остаются form-level errors.
11. Новых e2e-тестов нет; новые integration tests не добавлены без изменённой
    межмодульной границы.
12. Один combined review и не более одного combined re-review соблюдены.
13. После fix wave успешно выполнен полный финальный набор существующих
    проектных проверок.
14. `useZodForm` оформлен как отдельный кандидат для будущего переноса в
    `react-starter`; эта ветка не изменяет starter.
15. Основной checkout и посторонние worktree/ветки не изменены.
