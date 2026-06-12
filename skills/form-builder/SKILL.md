---
name: form-builder
description: Implement or refactor forms using the layered contract/factory/policy architecture. Use when creating a form, adding/removing/changing fields, changing validation, defaults, payload mapping, conditional field logic, submit error handling, or multi-step flows.
---

# Layered Form Builder

A form is not a UI widget — it is a state domain with a contract. Ask "what is the form's
contract, and what execution model makes it deterministic?", never "which form library?".
The full design rationale lives in `form_approach.md` (repo root); the working baseline
implementing everything below: `apps/react-rhf/src/form-demo/`.

Four design goals govern every decision:

- **Explicit over implicit** — defaults, validation, dependencies, and payload shape are
  declared, never inferred from render order or accidental behavior.
- **Single ownership** — every concern has exactly one home; a change has one obvious place
  to land.
- **Library-agnostic core** — contracts carry no dependency on the form runtime; the runtime
  is a swappable implementation detail. Agnosticism is scoped to the form runtime: the
  validation library (zod) is a deliberate, declared dependency of the contract layer.
- **Testable in isolation** — each concern is a pure function or a dumb component,
  unit-testable without mocking modules.

## The Five Pillars

Every form decomposes into the same five concerns. Four define the contract; one defines
execution. Keep them separate: cross-field logic never leaks into validation, payload shape
never leaks into the UI, performance tuning never rewrites the contract.

1. **Default values** — what state does the form start in (static / session / async-hydrated)?
   The source of a value is independent of how it is later judged or sent.
2. **Validation** — what makes a value acceptable (field-level, cross-field, contextual)?
3. **Payload mapping** — how does form state become the API contract? The payload factory is
   the single place form state becomes the request shape, and it is type-checked against the
   **backend-provided request type** — payload correctness is enforced by the API contract,
   not maintained by hand.
4. **Dependency handling** — how do fields and context reshape the form at runtime
   (visibility, payload inclusion)? The only concern about relationships between fields.
   Hidden-field semantics are declared here; the baseline is unmount + unregister with
   policy-driven payload omission.
5. **Reactivity strategy** — how state flows between form and fields: controlled state,
   narrow subscriptions, derive-on-change. Async edges (debounced async validation,
   stale-request cancellation, last-write-wins) live here. Delegated to the form runtime;
   it has no module of its own, only wiring conventions.

## Anatomy — required file layout

```
<form>/
├── field-contracts/
│   ├── shared/contract.ts        # FieldContractBase; validation & presentation shapes
│   ├── shared/guards.ts          # shared contract utilities (isString, deriveRequired, …)
│   └── <field>.ts                # one contract per field
├── factories/
│   ├── default-values-factory.ts # contracts + context → defaultValues
│   ├── validation-factory.ts     # zod object + superRefine for conditional fields
│   ├── payload-factory.ts        # values → API request shape (satisfies backend type)
│   ├── content-factory.ts        # labels/helper text + derived required indicator
│   └── submit-error-factory.ts   # API error keys → form field keys
├── policies.ts                   # conditional field participation rules
├── orchestration.tsx             # async context hydration + render contract
├── <form>.tsx                    # renderer: pure wiring, no rules
└── types.ts                      # canonical FormValues field key set
```

Dumb inputs live outside the form (e.g. `components/`) and are shared across forms.

## 1. types.ts — the canonical field key set

Declare `FormValues` once. The defaults, validation, and content factories are typed against
`keyof FormValues` (return type or `satisfies`), so adding a field produces a compile error
in every factory that does not handle it. This matters because the factories share no
runtime execution path — the type constraint is the only thing that catches a field mismatch
between them.

The **payload factory is the deliberate exception**: its keys follow the API's naming, not
the form's, so it cannot be constrained by `keyof FormValues`. Its output is constrained by
the backend request type via `satisfies`, and its input coverage by the typed `FormValues`
argument.

For CMS/runtime-configured forms, `FormValues` is necessarily a loose record and
field-to-contract dispatch is dynamic (e.g. by `inputType`); compile-time exhaustiveness is
replaced by runtime contract coverage. Everything else below stays identical.

## 2. Field contracts — the field's complete definition

A contract is a plain object with no dependency on the form runtime. It declares everything
intrinsic to the field: its canonical `name`, value coercion, default derivation, validity
(including required-ness), and presentation. Contracts are form-local by default; promote to
a shared library only when genuine reuse emerges.

```ts
// field-contracts/shared/contract.ts
interface FieldContractBase<TName extends string, TValue, TDefaultContext,
  TValidationContext = void, TPresentationContext = void> {
  name: TName
  normalizeValue: (value: unknown) => TValue
  defaultDataFactory: (context: TDefaultContext) => TValue
  validationSchemaFactory: (context?: TValidationContext) => ZodType<TValue>
  presentationFactory: (context?: TPresentationContext) => FieldContent  // label, helperText, placeholder
}
```

Validation is always exposed as `validationSchemaFactory` — fields whose rules do not depend
on context simply ignore the argument. One shape for every field, so every consumer calls
contracts the same way.

```ts
// field-contracts/company-name.ts
export const CompanyNameField = {
  name: 'company_name',
  validationSchemaFactory: () => z.string().trim().min(1, 'Company name is required'),
  normalizeValue: (value: unknown) => isString(value) ? value.trim() : '',
  defaultDataFactory: ({ profile }) => CompanyNameField.normalizeValue(profile.company_name),
  presentationFactory: () => ({ label: 'Company name' }),
} satisfies FieldContractBase<'company_name', string, Pick<Context, 'profile'>>
```

Rules:

- `name` is a typed literal; every other layer references the field as `Field.name` — field
  keys are never re-typed as string literals anywhere. (Payload keys that follow API naming
  are the exception; the `satisfies` check against the request type owns their correctness.)
- Required-ness is intrinsic: it lives on the validation schema. A conditional field that
  renders is required or not according to its own contract.
- Note what is absent: no JSX, no visibility rule, no payload key, no cross-field logic.
- Each contract receives only the context slice it needs (`Pick<Context, 'profile'>`).
- Select/radio option lists are declared alongside the contract and passed into inputs.
- When the product has an i18n runtime, validation messages and presentation copy are i18n
  keys (`'errors.username.required'`), not user-facing strings; the renderer translates at
  the display boundary (`error={error?.message && __(error.message)}`). The contract stays
  free of the i18n runtime either way. (The repo demo has no i18n runtime, so it carries
  plain strings — the boundary principle is unchanged.)

### Async validation — colocated with the contract, wired by convention

Async rules (username availability, address verification) are not forced into the
synchronous schema. An async validator is a plain util colocated with the field contract —
a pure async function: value in, error key (or message) or `null` out, cancellation via a
passed `AbortSignal`. Wiring conventions belong to the reactivity pillar and are uniform:

- runs debounced on value change, only after the field's synchronous schema passes
- each run aborts the previous in-flight request — last write wins, stale responses never land
- result surfaces via `setError`/`clearErrors` with a distinct error type (e.g. `type: 'async'`)
  so it composes with schema errors
- submit is blocked while a check is pending or failed

Implement these once as a shared runtime utility (e.g.
`useAsyncFieldValidation(control, name, validator)`); an individual form only picks the
validator and the field.

## 3. Policies — conditional field participation

Policies declare the conditions under which a field participates in the form. They exist
only for conditional fields — fields whose presence depends on other field values or
context. Unconditional fields have no policy entry.

Two baseline predicates: `visible` (does the field render) and `payloadCondition` (is it
included in the submit payload). **Both are declared explicitly** — in the common case they
are the same condition, and that repetition is deliberate: the policy map stays plain, fully
explicit data with no declaration-time helper. **`required` is not a policy predicate by
default** — only a field that is visible but contextually required adds an explicit
`required` predicate as a deliberate override. Hidden-field value retention is also declared
here: an optional `retainValueWhenHidden` flag (the baseline default is unmount + unregister,
value dropped).

```ts
type FieldPolicy<TDeps extends readonly (keyof FormValues)[]> = {
  deps: TDeps
  visible: (values: Pick<FormValues, TDeps[number]>, context: PolicyContext) => boolean
  payloadCondition: (values: Pick<FormValues, TDeps[number]>, context: PolicyContext) => boolean
}

export const FIELD_POLICIES: {
  [CompanyNameField.name]: FieldPolicy<[typeof AccountTypeField.name]>
  [PhoneNumberField.name]: FieldPolicy<[typeof PreferredContactField.name, typeof CountryField.name]>
} = {
  [CompanyNameField.name]: {
    deps: [AccountTypeField.name],
    visible: (values) => values[AccountTypeField.name] === 'company',
    payloadCondition: (values) => values[AccountTypeField.name] === 'company',
  },
  [PhoneNumberField.name]: {
    deps: [PreferredContactField.name, CountryField.name],
    visible: (values) =>
      values[PreferredContactField.name] === 'sms' && values[CountryField.name] === 'US',
    payloadCondition: (values) =>
      values[PreferredContactField.name] === 'sms' && values[CountryField.name] === 'US',
  },
}
```

Predicates receive the form values their `deps` declare (and the resolved external context
when a policy needs it). `deps` documents the dependency and drives the renderer's
subscription. The per-entry tuple annotation is load-bearing: it links `deps` to the values
a predicate may read, so the compiler rejects a predicate reading an undeclared field and a
`deps` array that drifts from its annotation. Never loosen the map's type to a uniform
`Record` — that dissolves the link.

Every consumer evaluates a policy through a single entry point:
`evaluatePolicy(policy, values, context) → { visible, includeInPayload }`. No call site
assembles a values or context slice by hand — that is what makes the guarantee real: the
renderer, the validation gate, and the payload mapping cannot diverge on what a policy sees,
because none of them decides what a policy sees. Change a policy and all three behaviors
follow.

## 4. Factories — contracts become form-wide concerns

Each factory walks the contracts and assembles one pillar for the whole form. Each is
consumed at a different lifecycle point: defaults at initialization, schema at the resolver,
content at render, payload at submit, error mapping after the response.

**default-values-factory** — calls every contract's `defaultDataFactory(contextSlice)`;
returns `FormValues` (exhaustive by return type).

**validation-factory** — builds the schema from the contracts:

```ts
return z.object({
  [FirstNameField.name]: FirstNameField.validationSchemaFactory(),   // unconditional: full schema
  [CompanyNameField.name]: z.string().optional(),                    // conditional: permissive here
  // …
} satisfies Record<keyof FormValues, ZodType>)                       // exhaustiveness
  .superRefine((values, ctx) => {
    const policy = evaluatePolicy(FIELD_POLICIES[CompanyNameField.name], values, formContext)
    if (policy.visible) {
      // run the field's COMPLETE contract schema, forward its issues
      const result = CompanyNameField.validationSchemaFactory().safeParse(values[CompanyNameField.name])
      result.error?.issues.forEach((issue) =>
        ctx.addIssue({ ...issue, path: [CompanyNameField.name] }))
    }
  })
```

Conditional fields are permissive in the base object and run their complete contract schema
in `superRefine`, gated on `policy.visible` — a hidden field can never fail validation.
Cross-field rules that are not policy-driven also live in `superRefine`. If a schema chains
an emptiness check and a format check, guard the format check so an empty value raises a
single issue.

**payload-factory** — normalizes through the contracts; conditional inclusion is gated
purely by `payloadCondition`; keys follow the API's naming:

```ts
export function payloadFactory(values: FormValues, context: PayloadContext) {
  const companyNamePolicy = evaluatePolicy(FIELD_POLICIES[CompanyNameField.name], values, context)
  return {
    [UsernameField.name]: UsernameField.normalizeValue(values[UsernameField.name]),
    email_address: EmailField.normalizeValue(values[EmailField.name]),   // API naming
    // …
    ...(companyNamePolicy.includeInPayload && {
      [CompanyNameField.name]: CompanyNameField.normalizeValue(values[CompanyNameField.name]),
    }),
  } satisfies CreateAccountRequest  // backend-provided: generated from the API spec, or shared and hand-declared
}
export type Payload = ReturnType<typeof payloadFactory>  // derived view for consumers
```

A wrong key, a wrong type, or a missing required field is a compile error. `ReturnType`
remains available to consumers, but correctness flows from the API contract, not from the
factory itself.

**content-factory** — aggregates each contract's `presentationFactory(ctx)` into a
`Record<keyof FormValues, ResolvedFieldContent>`. It declares no copy itself. The `required`
indicator is **derived, not declared** — `deriveRequired` (in `field-contracts/shared/guards.ts`)
probes the schema with the field's own empty representation so it works for every value type:

```ts
export const deriveRequired = (contract, ctx) =>
  !contract.validationSchemaFactory(ctx).safeParse(contract.normalizeValue(undefined)).success
```

Change the schema and the asterisk follows automatically. This relies on one convention that
must hold anyway: an optional field's schema accepts that field's empty value.

**submit-error-factory** — a pure function mapping API error field names back to form keys
(`email_address → email`, `country_code → country`). It is the only coupling point between
the API's naming and the form's naming.

## 5. Orchestrator — context before the form

The orchestrator loads context asynchronously (profile / config / settings, with abort
handling) and **renders the form only once context is resolved**, handing the renderer a
typed render contract: the resolved context plus a narrow submit mutation (`saveOnboarding`,
not a whole API client). It never renders fields and holds no validation or payload logic.
The form operates on a snapshot of context taken at mount; live context updates mid-edit are
out of scope.

## 6. Renderer — pure wiring, no rules

The renderer binds contracts/factories/policies to the runtime. It decides nothing. With
React Hook Form as the reference runtime:

```ts
const validationSchema = useMemo(() => validationFactory({ settings, profile }), [settings, profile])
const fieldContent = useMemo(() => contentFactory({ profile, settings }), [profile, settings])
const { control, handleSubmit, setError } = useForm({
  defaultValues: defaultValuesFactory(formContext),  // seeded ONCE; no re-seed (reset) path exists
  resolver: zodResolver(validationSchema),
  mode: 'onBlur',
  reValidateMode: 'onChange',
  shouldUnregister: true,            // hidden-field baseline: unmount + unregister
})
```

- The form mounts only after the orchestrator resolves context, seeds `useForm` a single
  time from `defaultValuesFactory(formContext)`, and never calls `reset` to re-seed.
- Unconditional fields bind a `Controller` to a dumb input; copy and `required` come from
  `fieldContent[Field.name]`.
- Conditional fields subscribe to exactly their policy's `deps` and evaluate through
  `evaluatePolicy`; render only when `policy.visible`. Hidden fields unmount and unregister
  (`shouldUnregister: true`), and the payload factory still gates them by policy.
- Submit: `payloadFactory(values, formContext)` → mutation → `submitErrorFactory(response)`
  → `setError` per mapped field, so server errors land on the originating field.

**Narrowing re-renders (optional optimization, not architecture):** a plain
`usePolicy(policy, control, context)`-style subscription at the top of the form re-renders
the whole form component when any watched dep changes — acceptable for most forms. When a
form has many fields or expensive subtrees, wrap conditional groups in a render-prop
observer that owns its own subscription, so only the affected subtree re-renders. The
observer takes the policy's `deps` and yields values keyed by field name, feeding straight
into `evaluatePolicy` — no call site assembles a slice by hand:

```tsx
<ValueObserver control={control} observed={FIELD_POLICIES[CompanyNameField.name].deps}>
  {(observedValues) => {
    const policy = evaluatePolicy(
      FIELD_POLICIES[CompanyNameField.name], observedValues, formContext,
    )
    return policy.visible && (
      <Controller name={CompanyNameField.name} control={control} render={/* … */} />
    )
  }}
</ValueObserver>
```

(See `shared/value-observer.tsx` in the baseline for the typed `useWatch` wrapper.)
Alternatively, extract conditional groups into child components that own their own
subscription. Both achieve the same isolation; policy evaluation, validation, and payload
mapping are unaffected either way.

## 7. Inputs — dumb, uniform, free of logic

Every input exposes the same core prop shape so the form can bind any input the same way:
`value`, `onChange`, `onBlur`, `inputRef`, `error`, plus `label`, `helperText`,
`placeholder`, `required`, `disabled`. Input-specific needs (a select's `options`, numeric
bounds) extend this base.

- **Everything is passed in, nothing is reached for.** No reading the form runtime from
  context, no resolving translations internally, no implicit provider dependency.
- **Inputs hold no logic.** No validation, no defaults, no normalization, no conditional
  visibility, no branching on form state. An input displays what it is given and reports
  what the user does. Logic inside an input is hidden from the contract/validation/policy/
  payload layers and erodes exactly the guarantees this architecture provides.
- Wrapping an input in a form-local field component is not an architectural concern — do it
  when composite fields or layout justify it, but the wrapper obeys the same rules: dumb,
  no logic, passes values through.

## 8. Transport

A form-specific API client sends the normalized payload and returns a response — it knows
nothing about the form. `submitErrorFactory` is the only bridge back. Submit goes through an
IoC boundary: the renderer calls the orchestrator-provided mutation with
`{ payload, headers }` and adapts normalized errors to the runtime (`setError`).

## End-to-end flow (verify every new form against this)

1. **Hydrate** — orchestrator loads context and renders the form only once context is
   resolved, handing it a render contract (context + mutation).
2. **Default** — `useForm` seeds once from `defaultValuesFactory(formContext)`; the form
   never re-seeds and works on the context snapshot taken at mount.
3. **Render & edit** — `Controller` binds contracts to dumb inputs; copy from
   `contentFactory`; conditional fields render on `policy.visible`, re-evaluated when their
   declared `deps` change.
4. **Validate** — factory schema on the runtime cadence (`mode: 'onBlur'`,
   `reValidateMode: 'onChange'`); conditional validation gated by `policy.visible` in
   `superRefine`, running each field's complete schema.
5. **Submit → payload** — `payloadFactory` normalizes and applies `payloadCondition`; its
   output satisfies the backend request type.
6. **Transport** — API client sends, returns response.
7. **Map back** — `submitErrorFactory` translates error keys; `setError` per field.

## Multi-step flows

Multi-step is the baseline applied per step — **never** one form with step-conditional
rendering and partial validation of a larger schema.

- One independent form per step: own `useForm`, own contracts, own `validationFactory`,
  own `contentFactory`. A step is complete when its own form submits successfully.
- Completed step values accumulate in external state (store / context / parent state).
- The final step merges all collected values, runs `payloadFactory` over the merged result,
  and submits — payload composition runs once.
- A step descriptor owns order, labels, and the active step; navigation lives in the
  orchestrator, not in step forms.
- Back navigation re-initializes that step's form with its stored values as defaults.
- Cross-step dependencies: earlier steps' values are passed as context to later steps'
  factories and policies — the same context mechanism as profile/config.

## Testing strategy

- **No module mocking.** Every layer takes its dependencies as arguments. Contracts,
  factories, and policies are tested as `expect(fn(input)).toEqual(output)` — no React, no
  form library, no DOM, no providers.
- **Policies are tested once, consumed everywhere** — one policy test covers visibility,
  validation gating, and payload inclusion, because all three consumers evaluate the same
  policy through `evaluatePolicy`.
- **Render tests stay thin**: right field appears, conditional visibility responds to value
  changes, submit invokes the mutation. They change when fields are added, not when rules
  change. The renderer holds no logic to test beyond wiring.

## Change map

**Add a field:** contract (with `name`) → `FormValues` in types.ts → fix the compile errors
this raises in the defaults/validation/content factories → map it in the payload factory
(the backend request type flags it if required) → bind in renderer. Input component only if
a new input type is needed.

**Add a conditional field:** the above, plus a typed policy entry (`deps`, `visible`,
`payloadCondition`, with the per-entry `FieldPolicy<[…]>` annotation); keep required-ness on
the contract schema; gate the full contract schema on `policy.visible` in `superRefine`;
gate payload inclusion on `includeInPayload`; render behind the policy subscribed to
`policy.deps`.

**Change a rule:** find its single owner (contract = intrinsic; policy = participation;
superRefine = cross-field; payload factory = API shape) and change it there only. If you are
about to change two layers for one rule, the rule is in the wrong place.

## Compliance checklist

- [ ] Field keys come from `Field.name`; no re-typed string literals (API-named payload keys
      excepted — the backend request type owns those).
- [ ] Required-ness lives on contract schemas; policies own participation only
      (`visible` and `payloadCondition`, both declared explicitly; `required` predicate
      only as a deliberate override).
- [ ] Policies declare `deps` with per-entry `FieldPolicy<[…]>` annotations linking `deps`
      to predicate inputs; every consumer goes through `evaluatePolicy`; no call site
      assembles a values/context slice by hand.
- [ ] Conditional validation gated on `policy.visible`, running the full contract schema.
- [ ] Payload inclusion gated purely by `payloadCondition`; payload output `satisfies` the
      backend-provided request type; keys follow API naming.
- [ ] Defaults, validation, and content factories exhaustive against `keyof FormValues`
      (payload factory is the deliberate exception).
- [ ] Required indicator derived via `deriveRequired` from the schema and the field's own
      empty value.
- [ ] Hidden fields unmount + unregister (unless a policy declares `retainValueWhenHidden`);
      payload still gates by policy.
- [ ] Orchestrator renders the form only once context is resolved; the form seeds once and
      has no re-seed (`reset`) path.
- [ ] Orchestrator renders no fields; renderer decides nothing; inputs hold no logic and
      reach for nothing.
- [ ] Logic tests are pure function calls; no module mocking anywhere.
- [ ] Multi-step (if present): one form per step, external accumulation, merge at submit.
