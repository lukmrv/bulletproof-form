---
name: form-builder
description: Implement or refactor forms using the layered contract/factory/policy architecture. Use when creating a form, adding/removing/changing fields, changing validation, defaults, payload mapping, conditional field logic, submit error handling, or multi-step flows.
---

# Layered Form Builder

A form is not a UI widget — it is a state domain with a contract. Ask "what is the form's
contract, and what execution model makes it deterministic?", never "which form library?".
The working baseline implementing everything below: `apps/react-rhf/src/form-demo/`.

Four design goals govern every decision:

- **Explicit over implicit** — defaults, validation, dependencies, and payload shape are
  declared, never inferred from render order or accidental behavior.
- **Single ownership** — every concern has exactly one home; a change has one obvious place
  to land.
- **Library-agnostic core** — contracts carry no dependency on the form runtime; the runtime
  is a swappable implementation detail.
- **Testable in isolation** — each concern is a pure function or a dumb component,
  unit-testable without mocking modules.

## The Five Pillars

Every form decomposes into the same five concerns. Four define the contract; one defines
execution. Keep them separate: cross-field logic never leaks into validation, payload shape
never leaks into the UI, performance tuning never rewrites the contract.

1. **Default values** — what state does the form start in (static / session / async-hydrated)?
2. **Validation** — what makes a value acceptable (field-level, cross-field, contextual)?
3. **Payload mapping** — how does form state become the API contract? The payload type is
   derived from the payload factory — one source of truth.
4. **Dependency handling** — how do fields and context reshape the form at runtime
   (visibility, payload inclusion)? The only concern about relationships between fields.
5. **Reactivity strategy** — how state flows between form and fields: controlled state,
   narrow subscriptions, derive-on-change. Delegated to the form runtime; it has no module
   of its own, only wiring conventions.

## Anatomy — required file layout

```
<form>/
├── field-contracts/
│   ├── shared/contract.ts        # FieldContractBase; validation & presentation shapes
│   ├── shared/guards.ts          # shared utilities (isString, isBoolean, …)
│   └── <field>.ts                # one contract per field
├── factories/
│   ├── default-values-factory.ts # contracts + context → defaultValues
│   ├── validation-factory.ts     # zod object + superRefine for conditional fields
│   ├── payload-factory.ts        # values → API request shape (payload type derived)
│   ├── content-factory.ts        # labels/helper text + derived required indicator
│   └── submit-error-factory.ts   # API error keys → form field keys
├── policies.ts                   # conditional field participation rules
├── orchestration.tsx             # async context hydration + render contract
├── <form>.tsx                    # renderer: pure wiring, no rules
└── types.ts                      # canonical FormValues field key set
```

Dumb inputs live outside the form (e.g. `components/`) and are shared across forms.

## 1. types.ts — the canonical field key set

Declare `FormValues` once. Every factory is typed against `keyof FormValues` (return type
or `satisfies`), so adding a field produces a compile error in every factory that does not
handle it. This matters because the factories share no runtime execution path — the type
constraint is the only thing that catches a field mismatch between them.

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
interface FieldContractBase<TName extends string, TValue, TDefaultContext, TPresentationContext> {
  name: TName
  normalizeValue: (value: unknown) => TValue
  defaultDataFactory: (context: TDefaultContext) => TValue
  presentationFactory: (context?: TPresentationContext) => FieldContent  // label, helperText, placeholder
}
// Two variants: validationSchema (static) or validationSchemaFactory(context) (contextual).
```

```ts
// field-contracts/company-name.ts
export const CompanyNameField = {
  name: 'company_name',
  validationSchema: z.string().trim().min(1, 'Company name is required'),
  normalizeValue: (value: unknown) => isString(value) ? value.trim() : '',
  defaultDataFactory: ({ profile }) => CompanyNameField.normalizeValue(profile.company_name),
  presentationFactory: () => ({ label: 'Company name' }),
} satisfies StaticValidationFieldContract<'company_name', string, Pick<Context, 'profile'>>
```

Rules:

- `name` is a typed literal; every other layer references the field as `Field.name` — field
  keys are never re-typed as string literals anywhere.
- Required-ness is intrinsic: it lives on the validation schema. A conditional field that
  renders is required or not according to its own contract.
- Note what is absent: no JSX, no visibility rule, no payload key, no cross-field logic.
- Each contract receives only the context slice it needs (`Pick<Context, 'profile'>`).
- Select/radio option lists are declared alongside the contract and passed into inputs.

## 3. Policies — conditional field participation

Policies declare the conditions under which a field participates in the form. They exist
only for conditional fields — fields whose presence depends on other field values or
context. Unconditional fields have no policy entry.

Two baseline predicates: `visible` (does the field render) and `payloadCondition` (is it
included in the submit payload). **`required` is not a policy predicate by default** — only
a field that is visible but contextually required adds an explicit `required` predicate as
a deliberate override.

```ts
export const FIELD_POLICIES = {
  [CompanyNameField.name]: {
    visible: (c) => c.account_type === 'company',
    payloadCondition: (c) => c.account_type === 'company',
  },
  // …
}
// buildConditionalFieldPolicy(rule, context) → { visible, includeInPayload }
```

Type each field's policy context precisely (a per-field context map), and have policies be
the single source of truth consumed independently by validation, payload mapping, and the
renderer — change a policy and all three behaviors follow.

## 4. Factories — contracts become form-wide concerns

Each factory walks the contracts and assembles one pillar for the whole form. Each is
consumed at a different lifecycle point: defaults at initialization, schema at the resolver,
content at render, payload at submit, error mapping after the response.

**default-values-factory** — calls every contract's `defaultDataFactory(contextSlice)`;
returns `FormValues` (exhaustive by return type).

**validation-factory** — builds the schema from the contracts:

```ts
return z.object({
  [FirstNameField.name]: FirstNameField.validationSchema,        // unconditional: full schema
  [CompanyNameField.name]: z.string().optional(),                // conditional: permissive here
  // …
} satisfies Record<keyof FormValues, ZodType>)                   // exhaustiveness
  .superRefine((values, ctx) => {
    const policy = buildConditionalFieldPolicy(FIELD_POLICIES[CompanyNameField.name],
      { account_type: values.account_type, profile })
    if (policy.visible) {
      // run the field's COMPLETE contract schema, forward its issues
      const result = CompanyNameField.validationSchema.safeParse(values[CompanyNameField.name])
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
purely by `payloadCondition`:

```ts
export function payloadFactory(values: FormValues, profile: Profile) {
  return {
    [UsernameField.name]: UsernameField.normalizeValue(values[UsernameField.name]),
    // …
    ...(companyNamePolicy.includeInPayload && {
      [CompanyNameField.name]: CompanyNameField.normalizeValue(values[CompanyNameField.name]),
    }),
  } satisfies FormValues   // or the API shape — keeps the factory exhaustive
}
export type Payload = ReturnType<typeof payloadFactory>   // derived, never hand-maintained
```

Every payload consumer is type-checked against the derived type.

**content-factory** — aggregates each contract's `presentationFactory(ctx)` into a
`Record<keyof FormValues, ResolvedFieldContent>`. It declares no copy itself. The `required`
indicator is **derived, not declared**: probe the field's validation schema with the field's
own empty representation so it works for every value type —

```ts
required: !validationSchema.safeParse(field.normalizeValue(undefined)).success
```

Change the schema and the asterisk follows automatically.

**submit-error-factory** — a pure function mapping API error field names back to form keys
(`email_address → email`, `country_code → country`). It is the only coupling point between
the API's naming and the form's naming.

## 5. Orchestrator — context before the form

The orchestrator loads context asynchronously (profile / config / settings, with abort
handling) and hands the renderer a typed render contract: the resolved context plus a narrow
submit mutation (`saveOnboarding`, not a whole API client). It never renders fields and
holds no validation or payload logic.

## 6. Renderer — pure wiring, no rules

The renderer binds contracts/factories/policies to the runtime. It decides nothing. With
React Hook Form as the reference runtime:

```ts
const validationSchema = useMemo(() => validationFactory({ settings, profile }), [settings, profile])
const fieldContent = useMemo(() => contentFactory({ profile, settings }), [profile, settings])
const { control, handleSubmit, reset, setError } = useForm({
  defaultValues: defaultValuesFactory(),
  resolver: zodResolver(validationSchema),
  mode: 'onBlur',
  reValidateMode: 'onChange',
  shouldUnregister: true,            // hidden-field baseline: unmount + unregister
})
useEffect(() => { reset(defaultValuesFactory(formContext)) }, [formContext, reset])
```

- Render immediately with static defaults, keep the whole `<fieldset>` `disabled` while
  hydrating, then `reset` once context arrives — the reset can never clobber user input.
- Unconditional fields bind a `Controller` to a dumb input; copy and `required` come from
  `fieldContent[Field.name]`.
- Conditional fields subscribe to their dependencies and evaluate the policy inline; render
  only when `policy.visible`. Hidden fields unmount and unregister
  (`shouldUnregister: true`), and the payload factory still gates them by policy.
- Submit: `payloadFactory(values, context)` → mutation → `submitErrorFactory(response)` →
  `setError` per mapped field, so server errors land on the originating field.

**Narrowing re-renders (optional optimization, not architecture):** inline `useWatch` calls
re-render the whole form component when any watched value changes — acceptable for most
forms. When a form has many fields or expensive subtrees, wrap conditional groups in a
render-prop observer that owns its own subscription, so only the affected subtree
re-renders:

```tsx
// shared/value-observer.tsx — typed wrapper over useWatch for narrow subscriptions
import type { ReactNode } from 'react'
import {
  type Control, type FieldPath, type FieldPathValues, type FieldValues, useWatch,
} from 'react-hook-form'

type ValueObserverProps<
  TFieldValues extends FieldValues,
  TObserved extends readonly FieldPath<TFieldValues>[],
> = {
  control: Control<TFieldValues>
  observed: readonly [...TObserved]
  children: (observedValue: FieldPathValues<TFieldValues, TObserved>) => ReactNode
}

export function ValueObserver<
  TFieldValues extends FieldValues,
  const TObserved extends readonly FieldPath<TFieldValues>[],
>({ control, observed, children }: ValueObserverProps<TFieldValues, TObserved>) {
  const observedValue = useWatch<TFieldValues, TObserved>({ control, name: observed })
  return <>{children(observedValue)}</>
}
```

```tsx
<ValueObserver control={control} observed={[AccountTypeField.name]}>
  {([account_type]) => {
    const policy = buildConditionalFieldPolicy(
      FIELD_POLICIES[CompanyNameField.name], { account_type, profile },
    )
    return policy.visible && (
      <Controller name={CompanyNameField.name} control={control} render={/* … */} />
    )
  }}
</ValueObserver>
```

Alternatively, extract conditional groups into child components that own their own
`useWatch`. Both achieve the same isolation; policy evaluation, validation, and payload
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

1. **Hydrate** — orchestrator loads context, hands render contract (context + mutation).
2. **Default** — `useForm` seeds from `defaultValuesFactory()`; on context arrival the form
   re-seeds via `reset(defaultValuesFactory(formContext))` (inputs disabled until then).
3. **Render & edit** — `Controller` binds contracts to dumb inputs; copy from
   `contentFactory`; conditional fields render on `policy.visible`.
4. **Validate** — factory schema on the runtime cadence; conditional validation gated by
   `policy.visible` in `superRefine`, running each field's complete schema.
5. **Submit → payload** — `payloadFactory` normalizes and applies `payloadCondition`; its
   return type is the request payload type.
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
  validation gating, and payload inclusion, because all three read the same function.
- **Render tests stay thin**: right field appears, conditional visibility responds to value
  changes, submit invokes the mutation. They change when fields are added, not when rules
  change. The renderer holds no logic to test beyond wiring.

## Change map

**Add a field:** contract (with `name`) → `FormValues` in types.ts → fix the compile errors
this raises in every factory → bind in renderer. Input component only if a new input type
is needed.

**Add a conditional field:** the above, plus a policy entry (`visible`,
`payloadCondition`); keep required-ness on the contract schema; gate the full contract
schema on `policy.visible` in `superRefine`; gate payload inclusion on `payloadCondition`;
render behind the policy with a narrow subscription.

**Change a rule:** find its single owner (contract = intrinsic; policy = participation;
superRefine = cross-field; payload factory = API shape) and change it there only. If you are
about to change two layers for one rule, the rule is in the wrong place.

## Compliance checklist

- [ ] Field keys come from `Field.name`; no re-typed string literals.
- [ ] Required-ness lives on contract schemas; policies own participation only
      (`visible`, `payloadCondition`; `required` predicate only as a deliberate override).
- [ ] Conditional validation gated on `policy.visible`, running the full contract schema.
- [ ] Payload inclusion gated purely by `payloadCondition`; payload type derived via
      `ReturnType`.
- [ ] All factories exhaustive against `keyof FormValues`.
- [ ] Required indicator derived from the schema via the field's own empty value.
- [ ] Hidden fields unmount + unregister; payload still gates by policy.
- [ ] Orchestrator renders no fields; renderer decides nothing; inputs hold no logic and
      reach for nothing.
- [ ] Logic tests are pure function calls; no module mocking anywhere.
- [ ] Multi-step (if present): one form per step, external accumulation, merge at submit.
