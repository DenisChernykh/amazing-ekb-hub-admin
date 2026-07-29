# RHF + Zod Forms Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Атомарно перевести все десять пользовательских form-flow с Ant Design Form store на React Hook Form и feature-level Zod validation с глобальной русской локалью, сохранив текущие UI, payload, dirty/reset и error contracts.

**Architecture:** React Hook Form становится единственным владельцем form state, native `form` — submit-границей, а Ant Design остаётся набором контролов и presentation-only `Form.Item`. Generated OpenAPI Zod schemas используются как transport building blocks и как assertions для итоговых request builders; feature schemas добавляют UI defaults, trim, `Dayjs`, conditional fields и create/edit semantics.

**Tech Stack:** React 19.2, React Hook Form 7.74, Zod 4.3, `@hookform/resolvers`, Ant Design 6.3, Dayjs, Vitest 4.1, Testing Library.

## Global Constraints

- Работать только в `/private/tmp/admin-codex-rhf-zod-forms` на ветке `refactor/rhf-zod-forms`; база — `origin/stage` commit `dc8e3475857748fdcb3c6da7f67d964da0c86180`.
- Мигрировать одним атомарным срезом все flow: login; category create/edit; content source create/edit; material create/edit; place create/edit; Yandex import start.
- Не менять backend, `openapi.yaml` и `src/shared/api/generated/**`.
- Синхронизировать validation snapshot только из локального code-first backend
  artifact `docs/api/openapi.json` и регенерировать
  `src/shared/api/generated-zod/**` через Orval; generated-файлы вручную не
  редактировать.
- Существующий runtime API client продолжает генерироваться из
  `openapi.yaml`. Полная миграция admin на новый backend contract, включая
  DTO, auth/CSRF и operation names, не входит в этот RHF/Zod-рефакторинг.
- Не менять API payload, entity mutation/cache contracts, server error presentation, cover upload sequence и active-import recovery.
- Не добавлять backend field error → `setError` mapping.
- Добавить только `@hookform/resolvers`; не добавлять form framework поверх RHF.
- Настроить Zod `ru` через `z.config(ru())` до первой runtime и test validation.
- Все RHF-controlled values имеют явные defaults: text `''`, select/date/number `null`, tags `[]`; `undefined` не используется как default или cleared value.
- Каждая форма явно передаёт `mode: 'onChange'` и `reValidateMode: 'onChange'`; shared hook не задаёт UX policy.
- Каждый flow использует `FormProvider` и native `<form noValidate>`; AntD root `Form` не используется.
- Удалить из мигрируемых flow top-level AntD `Form`, `Form.useForm`, `form` instance methods, `Form.Item name`, `rules`, `onFinish` и `onValuesChange`.
- Сохранить `Form.Item` только как presentation/layout primitive; field adapter и оставшиеся alert/chip/cover wrappers получают явный `layout="vertical"`.
- `PlaceCoverDraftPicker` остаётся application-managed file state.
- Сохранить существующие request builders и normalized edit dirty/chip helpers; подтверждать их output через generated request schema.
- Для новых и изменённых exported hand-written TS/TSX API добавить русский TSDoc по `docs/architecture/tsdoc-guidelines.md`.
- Перед созданием helper сверяться с `docs/architecture/helper-registry.md`; новые shared helpers записать в registry.
- Во время реализации запускать только focused unit/component tests изменяемого среза.
- Не запускать полный `pnpm run test`, typecheck, lint, format check или build после отдельных задач.
- Не добавлять `pnpm check` script и не выполнять `pnpm check`.
- Не добавлять e2e-тесты; новые integration-тесты не нужны, потому что межмодульный контракт не меняется.
- Провести один combined review всей реализации; Minor findings накопить и исправить одной общей fix wave.
- Critical/Important исправлять до fix wave только если finding блокирует дальнейшую реализацию.
- После fix wave допускается максимум один combined re-review; per-domain spec/quality/re-review запрещены.
- Полный финальный набор запускать только после реализации, combined review, fix wave и re-review при его необходимости.
- Финальный набор: `pnpm run typecheck`, `pnpm run lint:strict`, `pnpm run test`, `pnpm run format:check`, `pnpm run build`.
- Если финальная команда падает, сначала повторить только упавший script/test, исправить, получить focused PASS и затем повторить весь финальный набор.
- Не push-ить ветку, не создавать PR, не merge-ить и не deploy-ить без отдельного запроса пользователя.
- Стандартные per-task reviewer loops из `superpowers:subagent-driven-development` не применять: пользовательский combined-review contract имеет приоритет.

---

## File Map

### Shared foundation

- Create `src/shared/config/zod-locale.ts`: единственная runtime-настройка `z.config(ru())`.
- Create `src/shared/config/zod-locale.test.ts`: regression на точный built-in русский текст.
- Create `src/shared/lib/form/use-zod-form.ts`: typed schema → `zodResolver` → `useForm` adapter.
- Create `src/shared/lib/form/use-zod-form.test.tsx`: доказывает `z.input` storage и `z.output` submit.
- Create `src/shared/ui/form/rhf-form-item.tsx`: AntD `Form.Item` + RHF `useController` + accessibility.
- Create `src/shared/ui/form/rhf-form-item.test.tsx`: error/status/ARIA/focus contract.
- Modify `src/main.tsx`, `src/test/setup.ts`, `package.json`, `pnpm-lock.yaml`.
- Modify `docs/architecture/helper-registry.md`.

### Backend validation contract

- Modify `orval.config.ts`: оставить runtime client на `openapi.yaml`, а
  generated Zod перевести на `openapi/openapi.json`.
- Modify `scripts/api/openapi-source.mjs`,
  `scripts/api/sync-openapi.mjs` и их focused tests: локальный backend artifact
  является default source и проверяется на операции всех мигрируемых форм.
- Create `openapi/openapi.json` синхронизацией из локального backend worktree.
- Regenerate `src/shared/api/generated-zod/**` без ручных правок.
- Modify `README.md` и design spec: зафиксировать dual-input границу и
  `OPENAPI_SPEC_SOURCE` override.

### Feature schemas

- Create `src/features/auth/login/model/login-form-schema.ts`.
- Create `src/features/category/form/model/category-form-schema.ts`.
- Create `src/features/content-source/form/model/content-source-form-schema.ts`.
- Create `src/features/material/form/model/material-form-schema.ts`.
- Create `src/features/place/form/model/place-form-schema.ts`.
- Create `src/features/place/import-yandex/model/place-import-start-schema.ts`.

### Migrated UI

- Modify login form and test.
- Modify category model/model test, fields/fields test, create drawer and edit drawer; add focused create/edit drawer component tests.
- Modify content-source model/model test, fields, create/edit drawers and their component tests.
- Modify material model/model test, fields, create/edit drawers and their component tests.
- Modify place model/model test, fields/fields test, create/edit forms and their component tests.
- Modify Yandex import start form and test.
- Modify `PlaceCoverDraftPicker` only to make its presentation-only `Form.Item` layout explicit.

### Cross-project proposal

- Create `docs/architecture/use-zod-form-starter-candidate.md`: evidence-backed proposal for a separate `react-starter` task; do not modify the starter checkout.

---

### Task 1: Shared RHF/Zod Foundation and Login Reference Flow

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/shared/config/zod-locale.ts`
- Create: `src/shared/config/zod-locale.test.ts`
- Modify: `src/main.tsx`
- Modify: `src/test/setup.ts`
- Create: `src/shared/lib/form/use-zod-form.ts`
- Create: `src/shared/lib/form/use-zod-form.test.tsx`
- Create: `src/shared/ui/form/rhf-form-item.tsx`
- Create: `src/shared/ui/form/rhf-form-item.test.tsx`
- Create: `src/features/auth/login/model/login-form-schema.ts`
- Modify: `src/features/auth/login/ui/login-form.tsx`
- Modify: `src/features/auth/login/ui/login-form.test.tsx`
- Modify: `docs/architecture/helper-registry.md`

**Interfaces:**

- Consumes: generated `AuthLoginBody`; RHF `useForm`, `useController`, `Control`; Zod `z.input`/`z.output`; AntD `Form.Item`.
- Produces:
  - `useZodForm<TSchema>(schema, options): UseFormReturn<z.input<TSchema>, unknown, z.output<TSchema>>`;
  - `RhfFormItem<TFieldValues, TName, TTransformedValues>`;
  - `RhfControlStatusProps`;
  - `loginFormSchema`;
  - `LoginFormValues`.
- Later tasks must reuse `useZodForm` and `RhfFormItem`; they must not create domain-local resolver wrappers.

- [ ] **Step 1: Install the resolver dependency and materialize worktree dependencies**

Run:

```bash
pnpm add @hookform/resolvers
```

Expected:

- `@hookform/resolvers` appears in `dependencies`;
- `pnpm-lock.yaml` records a resolver version compatible with RHF 7.74 and Zod 4.3;
- worktree `node_modules` is available;
- no `check` script is added.

- [ ] **Step 2: Write failing locale, hook and adapter tests**

`src/shared/config/zod-locale.test.ts` must assert the currently installed Zod 4 Russian fallback exactly:

```ts
import { z } from 'zod'
import './zod-locale'

describe('zod locale', () => {
  it('uses the Russian locale for built-in validation issues', () => {
    const result = z.string().min(3).safeParse('')

    expect(result.error?.issues[0]?.message).toBe(
      'Слишком маленькое значение: ожидалось, что string будет иметь >=3 символа',
    )
  })
})
```

`src/shared/lib/form/use-zod-form.test.tsx` must submit a value with surrounding spaces and prove that the handler receives the Zod output:

```tsx
const schema = z.strictObject({
  title: z.string().trim().min(1, 'Введите название'),
})

function TestForm({
  onSubmit,
}: {
  onSubmit: (value: { title: string }) => void
}) {
  const form = useZodForm(schema, {
    defaultValues: { title: '' },
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <input aria-label="Название" {...form.register('title')} />
      <button type="submit">Сохранить</button>
    </form>
  )
}
```

Test interaction:

```ts
await userEvent.type(screen.getByLabelText('Название'), '  SPA  ')
await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
expect(onSubmit).toHaveBeenCalled()
expect(onSubmit.mock.calls[0]?.[0]).toEqual({ title: 'SPA' })
```

`src/shared/ui/form/rhf-form-item.test.tsx` must:

1. render a required field through `RhfFormItem`;
2. submit it empty;
3. assert exact `Введите название`;
4. assert `aria-invalid="true"`;
5. assert `aria-describedby` points at the rendered error element;
6. enter a valid value and assert the error/status relationship disappears;
7. prove the submit handler receives the value.

Run:

```bash
pnpm exec vitest run src/shared/config/zod-locale.test.ts src/shared/lib/form/use-zod-form.test.tsx src/shared/ui/form/rhf-form-item.test.tsx
```

Expected: FAIL because the three production modules do not exist.

- [ ] **Step 3: Implement global Russian locale initialization**

Create `src/shared/config/zod-locale.ts`:

```ts
import { z } from 'zod'
import { ru } from 'zod/locales'

z.config(ru())
```

Make the locale the first application side-effect import in `src/main.tsx`:

```ts
import '@/shared/config/zod-locale'
import App from '@/App'
```

Make it the first import in `src/test/setup.ts`:

```ts
import '@/shared/config/zod-locale'
import '@testing-library/jest-dom/vitest'
```

Do not import the initializer from generated files or individual feature schemas.

- [ ] **Step 4: Implement the typed `useZodForm` hook**

Use the following contract in `src/shared/lib/form/use-zod-form.ts`:

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form'
import { z } from 'zod'

type ZodFormSchema = z.ZodType<FieldValues, FieldValues>

type UseZodFormOptions<TSchema extends ZodFormSchema> = Omit<
  UseFormProps<z.input<TSchema>, unknown, z.output<TSchema>>,
  'resolver'
>

/**
 * Создаёт React Hook Form с типизированным Zod resolver.
 *
 * @remarks Hook не задаёт validation mode, default values или submit policy:
 * их явно определяет владелец конкретной формы.
 */
export function useZodForm<TSchema extends ZodFormSchema>(
  schema: TSchema,
  options: UseZodFormOptions<TSchema>,
): UseFormReturn<z.input<TSchema>, unknown, z.output<TSchema>> {
  return useForm<z.input<TSchema>, unknown, z.output<TSchema>>({
    ...options,
    resolver: zodResolver(schema),
  })
}
```

Do not add a type assertion to satisfy resolver typing. If the installed resolver types reject the signature, keep the public contract and resolve the generic constraint from the installed declarations; do not use `as`, `any` or a widened untyped resolver.

- [ ] **Step 5: Implement the AntD-specific `RhfFormItem`**

`src/shared/ui/form/rhf-form-item.tsx` must expose a render prop instead of adapting AntD event signatures:

```tsx
import { Form, type FormItemProps } from 'antd'
import { useId, type ReactNode } from 'react'
import {
  useController,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

/** Accessibility и validation props для конкретного AntD control. */
export type RhfControlStatusProps = {
  'aria-describedby'?: string
  'aria-invalid': boolean
  id: string
  status?: 'error'
}

/** Props presentation adapter между RHF field state и AntD `Form.Item`. */
export type RhfFormItemProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = Omit<
  FormItemProps,
  'children' | 'help' | 'htmlFor' | 'name' | 'rules' | 'validateStatus'
> & {
  children: (
    field: ControllerRenderProps<TFieldValues, TName>,
    controlProps: RhfControlStatusProps,
  ) => ReactNode
  control: Control<TFieldValues, unknown, TTransformedValues>
  controlId?: string
  name: TName
}

/**
 * Отображает RHF field error через AntD `Form.Item` и связывает его с control.
 */
export function RhfFormItem<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  children,
  control,
  controlId,
  name,
  ...formItemProps
}: RhfFormItemProps<TFieldValues, TName, TTransformedValues>) {
  const generatedId = useId()
  const { field, fieldState } = useController({ control, name })
  const inputId = controlId ?? generatedId
  const errorId = fieldState.error ? `${inputId}-error` : undefined

  return (
    <Form.Item
      {...formItemProps}
      help={
        fieldState.error ? (
          <span id={errorId}>{fieldState.error.message}</span>
        ) : undefined
      }
      htmlFor={inputId}
      layout="vertical"
      validateStatus={fieldState.error ? 'error' : undefined}
    >
      {children(field, {
        'aria-describedby': errorId,
        'aria-invalid': fieldState.invalid,
        id: inputId,
        status: fieldState.invalid ? 'error' : undefined,
      })}
    </Form.Item>
  )
}
```

Keep `control` explicit so TypeScript infers field/value types from each form. Do not spread `field` blindly into `Select`, `DatePicker` or `InputNumber`; wire each control's `value`, `onChange`, `onBlur` and `ref` explicitly.

- [ ] **Step 6: Make the foundation tests pass**

Run:

```bash
pnpm exec vitest run src/shared/config/zod-locale.test.ts src/shared/lib/form/use-zod-form.test.tsx src/shared/ui/form/rhf-form-item.test.tsx
```

Expected: PASS for locale, transformed submit output, exact error copy and ARIA relationship.

- [ ] **Step 7: Add the login feature schema and failing form assertions**

Create `src/features/auth/login/model/login-form-schema.ts` by reusing the
generated backend transport schema directly, like `react-starter`:

```ts
import { AuthLoginBody } from '@/shared/api/generated-zod/auth/auth.zod'
import { z } from 'zod'

/** Сгенерированная из backend OpenAPI Zod-схема формы входа администратора. */
export const loginFormSchema = AuthLoginBody

/** Значения RHF формы входа до и после Zod validation. */
export type LoginFormValues = z.input<typeof loginFormSchema>
```

Extend `login-form.test.tsx` with assertions for the exact Russian messages
produced by the generated schema and global Zod locale:

```ts
it('shows exact local validation messages and blocks an invalid login', async () => {
  const mutate = vi.fn()
  mockedUseLoginSession.mockReturnValue({
    isPending: false,
    mutate,
  } as unknown as ReturnType<typeof useLoginSession>)

  render(
    <AntdApp>
      <LoginForm onLoggedIn={vi.fn()} />
    </AntdApp>,
  )

  await userEvent.type(screen.getByLabelText('Email'), 'not-an-email')
  await userEvent.click(screen.getByRole('button', { name: 'Войти' }))

  expect(await screen.findByText('Введите корректный email')).toBeInTheDocument()
  expect(screen.getByText('Введите пароль')).toBeInTheDocument()
  expect(mutate).not.toHaveBeenCalled()
})
```

Run:

```bash
pnpm exec vitest run src/features/auth/login/ui/login-form.test.tsx
```

Expected: FAIL while AntD Form remains and the new schema is not wired.

- [ ] **Step 8: Migrate login to RHF**

In `login-form.tsx`:

- import `loginFormSchema` and `LoginFormValues`;
- create `useZodForm(loginFormSchema, { defaultValues: { email: '', password: '' }, mode: 'onChange', reValidateMode: 'onChange' })`;
- wrap a native `<form name="admin-login" noValidate onSubmit={form.handleSubmit(handleSubmit)}>` in `<FormProvider {...form}>`;
- render email and password through `RhfFormItem`;
- preserve icons, autocomplete, size, pending button, mutation payload, bulk-draft cleanup, message behavior and `onLoggedIn`;
- remove AntD root `Form`, `rules` and `onFinish`.

The submit boundary must remain:

```ts
const handleSubmit = (values: LoginFormValues) => {
  loginMutation.mutate({ data: values })
}
```

Run:

```bash
pnpm exec vitest run src/features/auth/login/ui/login-form.test.tsx src/shared/ui/form/rhf-form-item.test.tsx
```

Expected: PASS; invalid fields block mutation and valid credentials preserve the existing payload.

- [ ] **Step 9: Register shared helpers and commit**

Add two rows under new `Shared Form Helpers` and `Shared UI` entries in `docs/architecture/helper-registry.md`:

```md
| `useZodForm` | `src/shared/lib/form/use-zod-form.ts` | exported | Creates a typed RHF instance from a Zod schema while preserving separate input/output types and caller-owned form policy. |
| `RhfFormItem` | `src/shared/ui/form/rhf-form-item.tsx` | exported | Maps one RHF field/error to an accessible AntD `Form.Item` through an explicit control render prop. |
```

Run only the focused files one last time:

```bash
pnpm exec vitest run src/shared/config/zod-locale.test.ts src/shared/lib/form/use-zod-form.test.tsx src/shared/ui/form/rhf-form-item.test.tsx src/features/auth/login/ui/login-form.test.tsx
```

Then commit:

```bash
git add package.json pnpm-lock.yaml src/main.tsx src/test/setup.ts src/shared/config src/shared/lib/form src/shared/ui/form src/features/auth/login docs/architecture/helper-registry.md
git commit -m "refactor(forms): add RHF Zod foundation"
```

---

### Task 2: Category Create/Edit Migration

**Files:**

- Create: `src/features/category/form/model/category-form-schema.ts`
- Modify: `src/features/category/form/model/category-form.ts`
- Modify: `src/features/category/form/model/category-form.test.ts`
- Modify: `src/features/category/form/ui/category-form-fields.tsx`
- Modify: `src/features/category/form/ui/category-form-fields.test.tsx`
- Modify: `src/features/category/create/ui/create-category-drawer.tsx`
- Create: `src/features/category/create/ui/create-category-drawer.test.tsx`
- Modify: `src/features/category/edit/ui/edit-category-drawer.tsx`
- Create: `src/features/category/edit/ui/edit-category-drawer.test.tsx`

**Interfaces:**

- Consumes: `useZodForm`, `RhfFormItem`, generated `CreatePlaceCategoryBody` and `UpdatePlaceCategoryBody`.
- Produces: `createCategoryFormSchema`, `editCategoryFormSchema`, `CategoryFormValues`.
- Preserves: backend-generated slug on create; required slug on edit; normalized dirty/chips; partial PATCH; guarded close/reset.

- [ ] **Step 1: Write schema and generated-contract tests**

Add tests that prove:

```ts
expect(
  createCategoryFormSchema.safeParse({ slug: '', title: '' }).error?.issues[0]
    ?.message,
).toBe('Введите название')

expect(
  editCategoryFormSchema.safeParse({ slug: '', title: 'SPA' }).error?.issues[0]
    ?.message,
).toBe('Введите ярлык')

expect(
  editCategoryFormSchema.safeParse({ slug: 'Семейное кафе', title: 'SPA' })
    .error?.issues[0]?.message,
).toBe(
  'Используйте маленькие латинские буквы, цифры и дефисы, например family-cafe',
)
```

For every existing builder case, capture the request and parse it:

```ts
const request = toCreateCategoryRequest(values)
expect(CreatePlaceCategoryBody.parse(request)).toEqual(request)

const update = toUpdateCategoryRequest(values, initialValues)
expect(UpdatePlaceCategoryBody.parse(update)).toEqual(update)
```

Run:

```bash
pnpm exec vitest run src/features/category/form/model/category-form.test.ts
```

Expected: FAIL because schemas do not exist and contract assertions are not imported.

- [ ] **Step 2: Implement category schemas and derived values type**

`category-form-schema.ts` must:

- start from `CreatePlaceCategoryBody.shape.title`;
- trim title and require `Введите название`;
- trim slug before validating it through the generated slug schema;
- allow `''` on create;
- reject `''` with `Введите ярлык` on edit;
- use the exact existing slug guidance message;
- export a Zod-derived `CategoryFormValues`.

Core structure:

```ts
const isGeneratedCreateSlug = (value: string) =>
  !value || CreatePlaceCategoryBody.shape.slug.unwrap().safeParse(value).success

const optionalCategorySlugSchema = z
  .string()
  .trim()
  .refine(
    isGeneratedCreateSlug,
    'Используйте маленькие латинские буквы, цифры и дефисы, например family-cafe',
  )

/** Zod-схема create-формы категории. */
export const createCategoryFormSchema = z.strictObject({
  slug: optionalCategorySlugSchema,
  title: CreatePlaceCategoryBody.shape.title.trim().min(1, 'Введите название'),
})

/** Zod-схема edit-формы категории. */
export const editCategoryFormSchema = z.strictObject({
  slug: z
    .string()
    .trim()
    .min(1, 'Введите ярлык')
    .refine(
      (value) =>
        UpdatePlaceCategoryBody.shape.slug.unwrap().safeParse(value).success,
      'Используйте маленькие латинские буквы, цифры и дефисы, например family-cafe',
    ),
  title: createCategoryFormSchema.shape.title,
})

/** Значения общей RHF формы категории. */
export type CategoryFormValues = z.input<typeof editCategoryFormSchema>
```

Update `category-form.ts` to import the type from this file. Keep the create
defaults private in `create-category-drawer.tsx`:

```ts
const categoryCreateDefaultValues: CategoryFormValues = {
  slug: '',
  title: '',
}
```

Remove the now-unused exported `getCategorySlugValidationError`; the feature
schema and its exact-message tests become the only category slug validation
owner.

- [ ] **Step 3: Migrate category fields to the shared adapter**

Change `CategoryFormFieldsProps` to receive typed `control`; remove `slugRequired`. Use:

```tsx
<RhfFormItem control={control} label="Название" name="title">
  {(field, controlProps) => (
    <Input
      {...controlProps}
      disabled={disabled}
      onBlur={field.onBlur}
      onChange={field.onChange}
      ref={field.ref}
      value={field.value}
    />
  )}
</RhfFormItem>
```

For slug, preserve `extra`, placeholder and `showSlug`; validation now belongs only to the selected schema.

Update `category-form-fields.test.tsx` to render a small `useZodForm` + `FormProvider` + native form harness. Preserve the three existing visibility assertions and add one submit assertion for the exact invalid slug message.

- [ ] **Step 4: Migrate create drawer and add focused component coverage**

Create form:

```ts
const form = useZodForm(createCategoryFormSchema, {
  defaultValues: { slug: '', title: '' },
  mode: 'onChange',
  reValidateMode: 'onChange',
})
const { isDirty } = form.formState
```

Use `form.reset()` on successful mutation and clean close. Use native form submit. Keep the existing modal copy and API alert unchanged.

New component tests must prove:

- empty submit shows exact `Введите название` and does not mutate;
- `'  SPA  '` submits `{ title: 'SPA' }` without slug;
- changing title then closing opens the existing confirmation modal;
- mutation success resets and closes.

- [ ] **Step 5: Migrate edit drawer with derived normalized dirty/chips**

Use:

```ts
const initialValues = getCategoryFormInitialValues(category)
const form = useZodForm(editCategoryFormSchema, {
  defaultValues: initialValues,
  mode: 'onChange',
  reValidateMode: 'onChange',
})
const values = useWatch({
  control: form.control,
  compute: (currentValues) => currentValues,
})
const changedFields = getCategoryFormChangedFields(values, initialValues)
const isDirty = changedFields.length > 0
```

Remove local `isDirty` and `changedFields` state. Use `form.reset(initialValues)` for close/success. Keep the no-diff guard and partial request builder.

New component tests must prove:

- initial title/slug and disabled save;
- whitespace-only title does not enable save or render a changed chip;
- slug clear shows `Введите ярлык` and blocks mutation;
- valid title/slug change renders the exact chips and submits only changed normalized fields;
- dirty close keeps the existing modal copy.

- [ ] **Step 6: Run category-focused tests and commit**

Run:

```bash
pnpm exec vitest run src/features/category/form/model/category-form.test.ts src/features/category/form/ui/category-form-fields.test.tsx src/features/category/create/ui/create-category-drawer.test.tsx src/features/category/edit/ui/edit-category-drawer.test.tsx
```

Expected: PASS.

Commit:

```bash
git add src/features/category
git commit -m "refactor(category): migrate forms to RHF Zod"
```

---

### Task 3: Content Source Create/Edit Migration

**Files:**

- Create: `src/features/content-source/form/model/content-source-form-schema.ts`
- Modify: `src/features/content-source/form/model/content-source-form.ts`
- Modify: `src/features/content-source/form/model/content-source-form.test.ts`
- Modify: `src/features/content-source/form/ui/content-source-form-fields.tsx`
- Modify: `src/features/content-source/create/ui/create-content-source-drawer.tsx`
- Modify: `src/features/content-source/create/ui/create-content-source-drawer.test.tsx`
- Modify: `src/features/content-source/edit/ui/edit-content-source-drawer.tsx`
- Modify: `src/features/content-source/edit/ui/edit-content-source-drawer.test.tsx`

**Interfaces:**

- Consumes: shared RHF foundation; generated `CreateContentSourceBody` and `UpdateContentSourceBody`; shared `isSafeHttpUrl`.
- Produces: `createContentSourceFormSchema`, `editContentSourceFormSchema`, `ContentSourceFormValues`.
- Preserves: read-only platform in edit, optional identity strings, explicit `null` clears, normalized dirty/chips, API alerts and guarded close.

- [ ] **Step 1: Add failing schema and request-contract tests**

Add exact validation cases:

```ts
expect(
  createContentSourceFormSchema
    .safeParse({
      channelId: '',
      displayName: '',
      externalId: '',
      handle: '',
      platform: null,
      url: '',
    })
    .error?.issues.map((issue) => issue.message),
).toEqual(
  expect.arrayContaining([
    'Выберите платформу',
    'Введите название',
    'Введите ссылку',
  ]),
)

expect(
  createContentSourceFormSchema.safeParse({
    channelId: '',
    displayName: 'Unsafe',
    externalId: '',
    handle: '',
    platform: 'telegram',
    url: 'javascript://example.com/alert',
  }).error?.issues[0]?.message,
).toBe('Введите ссылку с протоколом http или https')
```

Parse create/update builder outputs with `CreateContentSourceBody` and `UpdateContentSourceBody`.

Run:

```bash
pnpm exec vitest run src/features/content-source/form/model/content-source-form.test.ts
```

Expected: FAIL until schema exports exist.

- [ ] **Step 2: Implement content-source schemas and complete defaults**

Build shared UI shape:

```ts
const requiredPlatformSchema = z
  .union([CreateContentSourceBody.shape.platform, z.null()])
  .refine((platform) => platform !== null, 'Выберите платформу')

const sourceUrlSchema = z
  .string()
  .trim()
  .min(1, 'Введите ссылку')
  .refine(
    (url) =>
      CreateContentSourceBody.shape.url.safeParse(url).success &&
      isSafeHttpUrl(url),
    'Введите ссылку с протоколом http или https',
  )

const contentSourceFormShape = {
  channelId: z.string().trim(),
  displayName: CreateContentSourceBody.shape.displayName
    .trim()
    .min(1, 'Введите название'),
  externalId: z.string().trim(),
  handle: z.string().trim(),
  platform: requiredPlatformSchema,
  url: sourceUrlSchema,
}
```

Export separate strict create/edit schemas even though their current shapes match, so operation requirements can diverge without changing consumers. Derive `ContentSourceFormValues` from the create schema.

Use exact defaults in create:

```ts
{
  channelId: '',
  displayName: '',
  externalId: '',
  handle: '',
  platform: null,
  url: '',
}
```

Update model normalization to accept `platform: ContentSourcePlatform | null`; keep `getRequiredValue` as the request-boundary invariant.

- [ ] **Step 3: Migrate fields and create drawer**

`ContentSourceFormFields` receives `control`; every `Input`/`Select` uses `RhfFormItem`. Preserve `platformDisabled`, all labels and input disabled state.

Create drawer uses `form.formState.isDirty`, `form.reset()`, native form and existing alert/modal callbacks. Extend existing tests to assert:

- exact required messages on empty submit;
- normalized valid payload;
- unsafe URL message and blocked mutation;
- existing normalized backend error;
- guarded dirty close.

- [ ] **Step 4: Migrate edit drawer with derived diff**

Use `useWatch({ control, compute: values => values })`, existing normalized helpers and render-derived chips. Remove local dirty/chip state.

Preserve:

- platform control disabled;
- editable name, URL, External ID, Handle and Channel ID;
- cleared optional values become `null`;
- unchanged platform never enters `UpdateContentSourceRequest`;
- existing modal and API messages.

Update tests to prove initial read-only platform, exact chips, partial payload with `null` clears, whitespace-only no-diff and dirty close.

- [ ] **Step 5: Run content-source-focused tests and commit**

Run:

```bash
pnpm exec vitest run src/features/content-source/form/model/content-source-form.test.ts src/features/content-source/create/ui/create-content-source-drawer.test.tsx src/features/content-source/edit/ui/edit-content-source-drawer.test.tsx
```

Expected: PASS.

Commit:

```bash
git add src/features/content-source
git commit -m "refactor(content-source): migrate forms to RHF Zod"
```

---

### Task 4: Material Create/Edit Migration

**Files:**

- Create: `src/features/material/form/model/material-form-schema.ts`
- Modify: `src/features/material/form/model/material-form.ts`
- Modify: `src/features/material/form/model/material-form.test.ts`
- Modify: `src/features/material/form/ui/material-form-fields.tsx`
- Modify: `src/features/material/create/ui/create-material-drawer.tsx`
- Modify: `src/features/material/create/ui/create-material-drawer.test.tsx`
- Modify: `src/features/material/edit/ui/edit-material-drawer.tsx`
- Modify: `src/features/material/edit/ui/edit-material-drawer.test.tsx`

**Interfaces:**

- Consumes: shared RHF foundation; generated `CreatePlaceMaterialBody` and `UpdateMaterialBody`; Dayjs; material URL helper.
- Produces:
  - `createMaterialFormSchema`;
  - `editMaterialWithUrlFormSchema`;
  - `editMaterialWithoutUrlFormSchema`;
  - `MaterialFormValues`.
- Preserves: calendar date serialization, conditional duration visibility/cleanup, list models without URL, normalized dirty/chips and partial PATCH.

- [ ] **Step 1: Add failing schema, conditional-field and transport tests**

Add tests for:

- null platform → `Выберите платформу`;
- null type → `Выберите тип материала`;
- blank title → `Введите заголовок`;
- null date → `Выберите дату публикации`;
- unsafe URL → exact shared HTTP message;
- create/edit-with-URL reject blank URL;
- edit-without-URL accepts `url: ''`;
- post ignores a stale duration;
- video accepts `durationSec: null` or a number from AntD `InputNumber`;
- create and update builder outputs parse with generated request schemas;
- `publishedAt` remains `YYYY-MM-DD` without UTC day shift.

Core assertions:

```ts
expect(
  editMaterialWithoutUrlFormSchema.safeParse({
    durationSec: null,
    platform: 'telegram',
    publishedAt: dayjs('2026-03-20'),
    title: 'Пост',
    type: 'post',
    url: '',
  }).success,
).toBe(true)

expect(CreatePlaceMaterialBody.parse(createRequest)).toEqual(createRequest)
expect(UpdateMaterialBody.parse(updateRequest)).toEqual(updateRequest)
```

Run:

```bash
pnpm exec vitest run src/features/material/form/model/material-form.test.ts
```

Expected: FAIL until schemas exist.

- [ ] **Step 2: Implement material schemas without forcing Dayjs into generated transport schemas**

Use generated enum/title/URL schemas where runtime types match. Use a hand-written Dayjs schema:

```ts
const publishedAtSchema = z
  .union([
    z.custom<Dayjs>(
      (value) => dayjs.isDayjs(value) && value.isValid(),
      'Выберите дату публикации',
    ),
    z.null(),
  ])
  .refine((value) => value !== null, 'Выберите дату публикации')
```

Build `platform` and `type` as generated enum + `null` unions with exact
required messages. Build `durationSec` from the generated numeric runtime
contract with a `null` UI value. Keep `min={0}` and `precision={0}` on
`InputNumber`; do not reject an ignored stale duration when the selected type
does not support duration.

Build URL variants:

```ts
const requiredMaterialUrlSchema = z
  .string()
  .trim()
  .min(1, 'Введите ссылку')
  .refine(
    (url) =>
      CreatePlaceMaterialBody.shape.url.safeParse(url).success &&
      isSafeMaterialUrl(url),
    'Введите ссылку с протоколом http или https',
  )

const materialWithoutUrlSchema = z.string()
```

Export three strict object schemas. All three must infer the same `MaterialFormValues` field types; only runtime validation differs for `url`.

Do not require duration because the current transport contract permits `null`.

- [ ] **Step 3: Migrate material fields**

Replace AntD `shouldUpdate` with:

```ts
const materialType = useWatch({
  control,
  name: 'type',
})
```

Render duration with boolean `&&`. Wire:

- `Select`: `value`, `onChange`, `onBlur`, `ref`;
- `Input`: `value`, `onChange`, `onBlur`, `ref`;
- `DatePicker`: `value`, `onChange={(value) => field.onChange(value)}`;
- `InputNumber`: `value`, `onChange={(value) => field.onChange(value)}`.

Keep `min={0}`, `precision={0}`, date format, widths, labels and `showUrlField`.

- [ ] **Step 4: Migrate create drawer and preserve focused tests**

Defaults:

```ts
{
  durationSec: null,
  platform: null,
  publishedAt: null,
  title: '',
  type: null,
  url: '',
}
```

Use raw RHF `isDirty` for close guard. Preserve existing mutation args, pending state, API messages, reset and close callbacks.

Update existing component tests so they continue proving:

- normalized payload;
- date-only behavior for every type;
- API error stays form-level;
- unsafe URL is blocked;
- dirty close confirmation.

Add one empty-submit assertion containing all exact required messages.

- [ ] **Step 5: Migrate edit drawer with the correct URL schema variant**

Keep:

```ts
const showUrlField = typeof material.url === 'string'
const schema = showUrlField
  ? editMaterialWithUrlFormSchema
  : editMaterialWithoutUrlFormSchema
```

Pass `schema` to `useZodForm`; use complete `getMaterialFormInitialValues`. Derive values, dirty and chips with `useWatch` plus existing helpers. Remove local dirty/chip state.

Tests must preserve:

- initial values and disabled save;
- duration visible for video and hidden after type changes to post;
- type change from video to post produces `{ type: 'post', durationSec: null }`;
- edit without source URL succeeds for non-URL fields;
- URL field remains absent for list material without URL;
- normalized chip list and partial payload;
- dirty and clean close behavior.

- [ ] **Step 6: Run material-focused tests and commit**

Run:

```bash
pnpm exec vitest run src/features/material/form/model/material-form.test.ts src/features/material/create/ui/create-material-drawer.test.tsx src/features/material/edit/ui/edit-material-drawer.test.tsx
```

Expected: PASS.

Commit:

```bash
git add src/features/material
git commit -m "refactor(material): migrate forms to RHF Zod"
```

---

### Task 5: Place Create/Edit and Cover Layout Migration

**Files:**

- Create: `src/features/place/form/model/place-form-schema.ts`
- Modify: `src/features/place/form/model/place-form.ts`
- Modify: `src/features/place/form/model/place-form.test.ts`
- Modify: `src/features/place/form/ui/place-form-fields.tsx`
- Modify: `src/features/place/form/ui/place-form-fields.test.tsx`
- Modify: `src/features/place/create/ui/create-place-form.tsx`
- Modify: `src/features/place/create/ui/create-place-form.test.tsx`
- Modify: `src/features/place/edit/ui/edit-place-form.tsx`
- Modify: `src/features/place/edit/ui/edit-place-form.test.tsx`
- Modify: `src/features/place/cover/ui/place-cover-draft-picker.tsx`

**Interfaces:**

- Consumes: shared RHF foundation; generated `CreatePlaceBody` and `UpdatePlaceBody`; category query; existing cover mutations and validation.
- Produces: `createPlaceFormSchema`, `editPlaceFormSchema`, `PlaceFormValues`.
- Preserves: optional create slug, required edit slug, category loading/error state, tag/summary normalization, cover partial-success lock, partial PATCH and external navigation blocker.

- [ ] **Step 1: Add failing place schema and request-contract tests**

Assert:

```ts
expect(
  createPlaceFormSchema
    .safeParse({
      categoryId: null,
      slug: '',
      summary: '',
      tags: [],
      title: '',
    })
    .error?.issues.map((issue) => issue.message),
).toEqual(expect.arrayContaining(['Введите название', 'Выберите категорию']))

expect(
  editPlaceFormSchema.safeParse({
    categoryId: 'category_spa',
    slug: '',
    summary: '',
    tags: [],
    title: 'SPA',
  }).error?.issues[0]?.message,
).toBe('Введите ярлык')
```

Assert the exact slug guidance and parse all create/update builder outputs through `CreatePlaceBody`/`UpdatePlaceBody`.

Run:

```bash
pnpm exec vitest run src/features/place/form/model/place-form.test.ts
```

Expected: FAIL until schemas exist.

- [ ] **Step 2: Implement place create/edit schemas and null select semantics**

Build:

- title from `CreatePlaceBody.shape.title`, trimmed and required;
- category from `CreatePlaceBody.shape.categoryId | null`, rejecting null with exact copy;
- summary as trimmed string;
- tags from generated array runtime shape with `[]` default;
- create slug as trimmed `''` or generated-valid slug;
- edit slug as trimmed required generated-valid slug.

Use exact slug message:

```text
Используйте маленькие латинские буквы, цифры и дефисы, например quiet-spa
```

Derive:

```ts
export type PlaceFormValues = z.input<typeof editPlaceFormSchema>
```

Change `PlaceFormValues.categoryId` semantics to `string | null`. In the request builder, keep a private `getRequiredValue` guard before assigning `categoryId`. Initial server values remain strings.

Remove the now-unused exported `getPlaceSlugValidationError`; generated-backed
create/edit schema refinements and their exact-message tests replace it.

- [ ] **Step 3: Migrate place fields and category-query component test**

`PlaceFormFields` receives `control`; remove `slugRequired`; preserve `showSlug`.

Use `RhfFormItem` for title, slug, summary, category and tags. Keep category query error `Alert` outside `RhfFormItem`. Category and tags `Select` must receive controlled `null`/`[]` values.

Update `place-form-fields.test.tsx` to use a create-schema RHF harness and retain:

- failed category query renders `Не удалось загрузить категории`;
- category select is disabled;
- empty submit shows exact title/category errors;
- invalid slug has the exact guidance message.

- [ ] **Step 4: Migrate create form and preserve two-stage cover behavior**

Use defaults:

```ts
{
  categoryId: null,
  slug: '',
  summary: '',
  tags: [],
  title: '',
}
```

Use native form + `FormProvider`. Keep `selectedCoverFile`, `partialSuccess`, both mutations and the exact create/upload order unchanged.

In `PlaceCoverDraftPicker`, keep the existing file state and object-URL effect. Change only:

```tsx
<Form.Item label="Cover-фото" layout="vertical">
```

Do not register the file in RHF.

Update create tests to preserve every existing case:

- JSON create without cover;
- omitted summary/tags normalize to `''`/`[]`;
- valid cover uploads after create;
- invalid cover never uploads;
- backend API errors remain form-level;
- upload failure after create enters partial-success;
- partial-success blocks duplicate create;
- cancel and pending behavior.

Add one empty-submit test for exact title/category errors and zero mutation calls.

- [ ] **Step 5: Migrate edit form and synchronize the navigation blocker**

Derive current values:

```ts
const values = useWatch({
  control: form.control,
  compute: (currentValues) => currentValues,
})
const isDirty = hasPlaceFormChanges(values, initialValues)
```

Use exactly one new effect:

```ts
useEffect(() => {
  onDirtyChange?.(isDirty)
}, [isDirty, onDirtyChange])
```

Update the component TSDoc `@remarks` to explain:

- the effect synchronizes derived RHF dirty state with the owning widget's navigation blocker;
- render derivation cannot invoke the external callback safely;
- dependencies are the callback and normalized dirty boolean;
- no cleanup is needed because form/widget unmount together, while reset and success publish `false`.

On reset call `form.reset(initialValues)` and clear API errors. On mutation success reset/publish false before `onUpdated`. Preserve no-diff guard and partial payload.

Update existing tests to continue proving:

- initial values and disabled save;
- normalized partial update;
- cleared summary/tags;
- reset to server values and final `onDirtyChange(false)`;
- success callback;
- form-level API messages;
- pending/cancel behavior.

Add an exact required-slug test and assert normalized whitespace-only changes do not publish `true`.

- [ ] **Step 6: Run place-focused tests and commit**

Run:

```bash
pnpm exec vitest run src/features/place/form/model/place-form.test.ts src/features/place/form/ui/place-form-fields.test.tsx src/features/place/create/ui/create-place-form.test.tsx src/features/place/edit/ui/edit-place-form.test.tsx src/features/place/cover/ui/place-cover-draft-picker.test.tsx
```

Expected: PASS with create/upload partial-success and dirty callback behavior unchanged.

Commit:

```bash
git add src/features/place/form src/features/place/create src/features/place/edit src/features/place/cover/ui/place-cover-draft-picker.tsx
git commit -m "refactor(place): migrate forms to RHF Zod"
```

---

### Task 6: Yandex Import Form and Starter Candidate Documentation

**Files:**

- Create: `src/features/place/import-yandex/model/place-import-start-schema.ts`
- Modify: `src/features/place/import-yandex/ui/place-import-start-form.tsx`
- Modify: `src/features/place/import-yandex/ui/place-import-start-form.test.tsx`
- Create: `docs/architecture/use-zod-form-starter-candidate.md`
- Modify: `docs/architecture/helper-registry.md`

**Interfaces:**

- Consumes: shared RHF foundation; generated `StartYandexMapsPlaceImportBody`; shared HTTP URL validation; existing structured-conflict extractor.
- Produces: `placeImportStartSchema`, `PlaceImportStartValues`; a proposal-only starter adoption document.
- Preserves: exact active-import structured `409` resume and current form-level error behavior.

- [ ] **Step 1: Add failing schema/component assertions**

Schema tests may live in the existing component test file because the schema has one field. Add:

```ts
expect(
  placeImportStartSchema.safeParse({ url: '' }).error?.issues[0]?.message,
).toBe('Вставьте ссылку на карточку организации')

expect(
  placeImportStartSchema.safeParse({ url: 'javascript:alert(1)' }).error
    ?.issues[0]?.message,
).toBe('Введите ссылку с протоколом http или https')
```

Add component tests:

- invalid URL renders exact local error and never mutates;
- a valid URL with spaces submits a trimmed URL;
- existing structured 409 invokes `onStarted('operation-existing')` and does not render the backend message.

Run:

```bash
pnpm exec vitest run src/features/place/import-yandex/ui/place-import-start-form.test.tsx
```

Expected: FAIL until schema and RHF wiring exist.

- [ ] **Step 2: Implement the import schema**

Create:

```ts
import { AdminPlaceImportsStartBody } from '@/shared/api/generated-zod/admin-place-imports/admin-place-imports.zod'
import { isSafeHttpUrl } from '@/shared/lib/url/safe-url'
import { z } from 'zod'

/** Zod-схема URL для запуска импорта одной карточки Яндекс Карт. */
export const placeImportStartSchema = z.strictObject({
  url: z
    .string()
    .trim()
    .min(1, 'Вставьте ссылку на карточку организации')
    .refine(
      (url) =>
        AdminPlaceImportsStartBody.shape.url.safeParse(url).success &&
        isSafeHttpUrl(url),
      'Введите ссылку с протоколом http или https',
    ),
})

/** Значения RHF формы запуска импорта. */
export type PlaceImportStartValues = z.input<typeof placeImportStartSchema>
```

The generated schema supplies URL/max-length transport constraints; the shared helper narrows the scheme to `http`/`https`.

- [ ] **Step 3: Migrate the start form**

Use defaults `{ url: '' }`, explicit on-change modes, native form and `RhfFormItem`. Preserve:

- paragraph copy;
- `maxLength={2048}`, placeholder, autocomplete and input type;
- mutation pending button;
- clearing local error on valid submit;
- `getActivePlaceImportConflictOperationId` branch before generic error;
- success callback.

Submit the already-trimmed schema output:

```ts
const handleSubmit = ({ url }: PlaceImportStartValues) => {
  setErrorMessage(null)
  mutation.mutate({ url })
}
```

- [ ] **Step 4: Reconcile the helper registry with the final schema APIs**

Update `docs/architecture/helper-registry.md` in one integration-owned edit:

- add `loginFormSchema` and `LoginFormValues`;
- move the `CategoryFormValues` location to
  `category-form-schema.ts`, add `createCategoryFormSchema` and
  `editCategoryFormSchema`, and remove `getCategorySlugValidationError`;
- move the `ContentSourceFormValues` location to
  `content-source-form-schema.ts` and add both operation schemas;
- move the `MaterialFormValues` location to `material-form-schema.ts` and add
  create, edit-with-URL and edit-without-URL schemas;
- move the `PlaceFormValues` location to `place-form-schema.ts`, add both
  operation schemas, and remove `getPlaceSlugValidationError`;
- add `placeImportStartSchema` and `PlaceImportStartValues`;
- verify the Task 1 `useZodForm` and `RhfFormItem` rows match their final
  signatures.

Every registry contract must state that schemas own UI validation while
generated schemas remain transport contracts.

- [ ] **Step 5: Write the starter candidate proposal**

Create `docs/architecture/use-zod-form-starter-candidate.md` with these exact sections:

```md
# `useZodForm` Candidate for `react-starter`

## Status

Proposal for a separate starter task. This admin branch does not modify `react-starter`.

## Proven Contract

- `useZodForm<TSchema>(schema, options)` preserves `z.input<TSchema>` for RHF controls.
- Successful submit handlers receive `z.output<TSchema>`.
- The caller owns `defaultValues`, `mode`, `reValidateMode`, reset and server errors.
- Generated OpenAPI Zod fields can be composed into feature schemas without editing generated files.

## Evidence from Admin Flows

| Flow           | Evidence                                                                                |
| -------------- | --------------------------------------------------------------------------------------- |
| Login          | Generated email contract plus exact Russian required and email messages.                |
| Category       | Optional create slug, required edit slug and normalized partial PATCH.                  |
| Content source | Nullable select default, HTTP URL validation and explicit `null` clears.                |
| Material       | `Dayjs` UI value, conditional duration and edit models without URL.                     |
| Place          | Nullable category, tag normalization, cover partial success and external dirty blocker. |
| Yandex import  | Trimmed HTTP URL plus structured active-operation `409` recovery.                       |

## Starter Boundary

- Propose only `useZodForm`.
- Do not propose `RhfFormItem`: it is AntD-specific while `react-starter` uses a different UI foundation.
- Configure `z.config(ru())` in the starter's application/test entrypoints as a separate explicit decision.

## Adoption Checks

- Verify current RHF, Zod and resolver versions in the starter.
- Add focused hook tests for transformed output and generated-schema composition.
- Keep generated OpenAPI schemas transport-owned.
- Do not couple the hook to validation mode or server error mapping.
```

- [ ] **Step 6: Run import-focused tests and commit**

Run:

```bash
pnpm exec vitest run src/features/place/import-yandex/ui/place-import-start-form.test.tsx
```

Expected: PASS.

Commit:

```bash
git add src/features/place/import-yandex docs/architecture/use-zod-form-starter-candidate.md docs/architecture/helper-registry.md
git commit -m "refactor(place-import): migrate start form to RHF Zod"
```

---

### Task 7: Cross-Slice Audit, One Combined Review, Fix Wave and Final Verification

**Files:**

- Inspect: all files changed since `origin/stage`.
- Modify: only files named by combined review findings.
- Do not manually modify: generated API/Zod directories.

**Interfaces:**

- Consumes: completed Tasks 1–6.
- Produces: one reviewed, batch-fixed and fully verified branch.

- [ ] **Step 1: Run read-only inventory and architecture scans**

Run:

```bash
git status -sb
git diff --stat origin/stage...HEAD
rg -n 'Form\.useForm|onFinish=|onValuesChange=|rules=' src/features/auth/login src/features/category src/features/content-source src/features/material src/features/place
rg -n --pcre2 '<Form(?:<[^>]+>)?[ >]' src/features/auth/login src/features/category src/features/content-source src/features/material src/features/place
rg -n 'useEffect\(' src/features/auth/login src/features/category src/features/content-source src/features/material src/features/place
git diff --exit-code origin/stage -- src/shared/api/generated
git status --short openapi/openapi.json src/shared/api/generated-zod
```

Expected:

- no legacy form-store/rules/root-Form matches in the ten migrated flow;
- `Form.Item` may remain in shared adapter, alert/chip/layout wrappers and cover picker;
- only existing cover object-URL effect and the documented edit-place blocker effect are present in this migration scope;
- runtime generated client diff command exits 0;
- validation snapshot and generated Zod are present as expected generated
  changes from the local backend contract.

Also inspect every new/changed export against `docs/architecture/tsdoc-guidelines.md` and verify helper-registry entries match final signatures.

- [ ] **Step 2: Dispatch one combined reviewer for the entire diff**

Give the reviewer:

- design spec path;
- this plan path;
- `git diff origin/stage...HEAD`;
- the ten-flow inventory;
- explicit user verification/review constraints.

Reviewer prompt:

```text
Review the complete RHF + Zod migration as one implementation. Report only
actionable findings, each with severity Critical, Important, or Minor and exact
file/line evidence. Check all ten flows; generated-schema composition; exact
Russian validation copy; default values; input/output typing; AntD control
wiring; normalized dirty/reset/chips/PATCH behavior; place cover partial
success; Yandex active-import 409 recovery; server error boundary;
accessibility; React effect policy; TSDoc; helper registry; generated-file
immutability; and test gaps. Do not edit files. Do not create per-domain
reviews. Do not request full project checks yet.
```

Do not dispatch separate spec, quality or domain reviewers.

- [ ] **Step 3: Apply one batch fix wave**

Collect all non-blocking findings before editing. Fix them in one wave:

- Critical/Important contract defects first inside the same wave;
- all accepted Minor findings together;
- rejected findings documented in the handoff with concrete code evidence.

For each changed domain, run only its focused test file(s). Example mapping:

```text
shared/auth finding → shared foundation + login tests
category finding → category model/fields/create/edit tests
content-source finding → content-source model/create/edit tests
material finding → material model/create/edit tests
place finding → place model/fields/create/edit/cover tests
import finding → place-import-start-form test
```

Do not run the final project set during the fix wave.

Commit accepted fixes once:

```bash
git add -u
git commit -m "fix(forms): address combined migration review"
```

If the review has no accepted findings, do not create an empty commit.

- [ ] **Step 4: Run at most one combined re-review**

If Step 3 changed code, give the same reviewer the original findings and final diff. Ask only:

```text
Verify that the accepted combined-review findings are resolved and that the
batch fix introduced no Critical or Important regression. Return remaining
actionable findings only. Do not start a new per-domain review.
```

This is the only permitted re-review. Resolve a newly found release-blocking Critical/Important issue and run its focused tests; report remaining non-blocking disagreement rather than starting another reviewer loop.

- [ ] **Step 5: Run the final project verification set once**

Only now run, in order:

```bash
pnpm run typecheck
pnpm run lint:strict
pnpm run test
pnpm run format:check
pnpm run build
```

Record fresh output and exit status for every command. Do not claim PASS from an earlier run.

Failure protocol:

1. stop the sequence at the failed command;
2. run only that script, or only the failed Vitest file/test name;
3. fix the defect;
4. obtain focused PASS;
5. restart the complete five-command set from `pnpm run typecheck`.

Do not separately run any complete integration/e2e suite. If a future project script includes one and a scenario fails, rerun only that scenario before restarting the final set.

If final verification required tracked-file corrections, commit them only after
the restarted five-command set passes:

```bash
git add -u
git commit -m "fix(forms): resolve final verification failure"
```

If no file changed during final verification, do not create this commit.

- [ ] **Step 6: Perform final scope/status checks**

Run:

```bash
git status -sb
git diff --check origin/stage...HEAD -- . ':(exclude)src/shared/api/generated-zod/**'
git diff --name-only origin/stage...HEAD -- src/shared/api/generated
git diff --name-only origin/stage...HEAD -- openapi/openapi.json src/shared/api/generated-zod
rg -n 'Form\.useForm|onFinish=|onValuesChange=|rules=' src/features/auth/login src/features/category src/features/content-source src/features/material src/features/place
```

Expected:

- clean worktree;
- no whitespace errors in hand-written files; Orval-generated Zod output is
  excluded from manual whitespace normalization;
- no runtime generated client files;
- only the expected local validation snapshot and Orval-generated Zod files in
  the validation-generated set;
- no legacy form store/rules in migrated flow;
- branch remains local and unpushed.

Handoff must separately state:

- implementation scope;
- focused tests used during Tasks 1–6;
- combined review/fix/re-review result;
- fresh result of each final command;
- no e2e/integration additions;
- no generated/backend/starter changes;
- path to the starter proposal;
- current branch/commit and explicit “not pushed / no PR”.

Do not perform push, PR, merge, deployment or the post-merge completion ritual.

---

## Orchestration Notes

Task 1 is a strict prerequisite because every domain consumes its shared contracts.

After Task 1:

- one implementer owns Tasks 2 and 3 sequentially;
- one implementer owns Task 4;
- one implementer owns Task 5;
- the primary agent owns Task 6 and all shared/docs integration.

This allocation fits four concurrent slots including the primary agent and prevents parallel edits to shared files. Domain implementers commit only their listed directories and do not edit helper registry, package files, shared adapters or starter proposal.

Task 7 begins only after all implementation commits are integrated in the shared worktree. One combined reviewer inspects the whole branch. The primary agent owns the fix wave, final verification and evidence.
