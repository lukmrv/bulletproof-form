Motivation
Forms are one of the most bug-prone, safety and conversion-critical surfaces in the product (login, registration, age verification, commerce flow, contact, profile updates).
Today there is no shared forms architecture: each domain invented its own pattern from scratch with drastically varying quality

- No canonical architecture
- Validation is duplicated and render-coupled
- Untyped form → payload boundary
- Multi-step flows are brittle 
- Orchestration entangled with the form
- Fields aren't reusable / tied to runtime config and not library agnostic
- Specific layers for the forms are basically untestable without whole-module mocking


Overview
Design goal: the architecture treats a form not as a UI widget but as a state domain with a contract. The framing of the approach asks question "what is the form's contract, and what model of execution makes it deterministic" instead of "which form library is used?"
The approach is guided by four design goals: 

Explicit over implicit - defaults, validation, dependencies, and payload shape are declared, never inferred from render order or accidental behavior.
Single ownership - every concern has exactly one home, so a change has one obvious place to land.
Library-agnostic core - fields and contracts carry no dependency on the form runtime (the forms-handling library); the runtime is an implementation detail, swappable without touching the contract. Agnosticism is scoped to the form runtime: the validation library (zod) is a deliberate, declared dependency of the contract layer, not an implementation detail.
Testable in isolation - each concern is a pure function or a dumb component, unit-testable without mocking the whole module.
The Five Pillars
Practically every form in every domain is composed from the same five concerns. Four define the contract - what is true about the form. One defines execution - how it runs.
Keeping them separate is the main point of the approach, eg.: cross-field logic never leaks into validation, payload shape never leaks into the UI, and performance tuning never forces a rewrite of the contract.



Default values - what state does the form start in? 
Initialization from static values, session / user data / async hydration.
Source of a value is independent of how it's later judged or sent.

Validation - what makes a value acceptable? Field-level, cross-field, and session-phase rules.
Value acceptability is independent of where the value came from or where it's going.


Payload mapping - how does form state become the API contract?
The payload factory is the single place where form state becomes the request shape, and it is type-checked against the backend-provided request type - payload correctness is enforced by the API contract, not maintained by hand.

Dependency handling - how do fields and runtime context reshape the form at runtime? eg.: visibility, cross-field derivation, include / omit decisions.
It's the only concern about relationships between fields - centralizing it is what keeps conditional logic out of the other three.
Hidden-field semantics are declared here, and the baseline default is unmount + unregister with policy-driven payload omission.

Reactivity strategy - how state flows between the form and its fields?
The execution model: controlled state, narrow subscriptions, and derive-on-change side effects. Async edges (debounced async validation, stale-request cancellation, last-write-wins) live here.
This pillar has no module of its own - delegated to the form runtime, enforced by wiring conventions.

Field Component Requirements
The forms architecture pushes all behavior up into the contract, form, and payload layers, so the input components beneath them must stay thin, uniform, and free of logic. Below are the principles to keep them aligned, in increasing order of importance.

A uniform, shared prop shape. Every input should expose the same core set of props, so the form can bind any input the same way as any other. These cover the controlled wiring - the current value, a change handler, a blur handler, a ref to the focusable element, and an error to display - and the common presentational content such as label, helper text, placeholder, and required or disabled state. Input-specific needs, like the option list of a select or the bounds of a numeric input, are added on top of that shared base rather than reinventing it. A form author should be able to reach for any input already knowing its prop vocabulary.
However, consistency here is a a good practice and a convenience rather than a guarantee - a form could normalize a non-conforming input itself, but standardizing once at the source spares every consumer that work.

Everything is passed in, nothing is reached for. An input receives all of its values and content from its props: the runtime wiring, the labels, and any user-facing or translated text. It does not reach into ambient state - no reading of the form runtime from context, no resolving translations internally, no implicit dependency on a provider being present. Resolving such values is the form and contract layer's responsibility, and the input is simply handed the result.

Inputs are dumb and hold no logic. An input renders and wires; it does not decide anything. No validation rules, no defaults, no normalization, no conditional visibility, no branching on form or configuration state. It does not judge whether its value is valid, whether it should appear, or how its value should be transformed - it displays what it is given and reports what the user does. This principle matters the most: logic placed inside an input is hidden logic that the contract, validation, dependency, and payload layers can no longer see, compose, or test, so it erodes exactly the control and testability the architecture provides. The approach still holds when it is adopted partially or incrementally - that flexibility is one of its benefits, but every piece of behavior pushed into an input is a step away from those guarantees, and keeping inputs dumb is what lets the rest of the architecture deliver them fully.

Field wrappers approach - wrapping a base component vs binding it directly.
Deciding if an input is bound directly by the form or sits behind a form-local component is not an architectural concern. It depends on the specific form: composite fields, internal layout, or narrow cross-field behavior may justify a separate field layer, but most fields may not need it.
What matters is the form-specific field contract - defaults, validation, normalization, and policy ownership, not whether a wrapper exists around an input.
If a wrapper is introduced, it remains bound by the same principles - it stays dumb, holds no logic, and reaches for nothing. It only composes the inputs beneath it and passes values through.

Reference Architecture - "Anatomy of a Form"
The five pillars say what concerns exist. This section shows where they live and how they connect in one canonical form - a single-step baseline form. 
Multi-step flows are layered on top of exactly this structure and are covered in their own sections; everything here is the baseline they extend.

A form, fully decomposed, consists of the five contract concerns plus a set of supporting layers which the pillars deliberately do not name: context hydration, user-facing presentation, a transport boundary, and the dumb inputs. Naming all of them is the point of an "anatomy".

The parts


Field contract Field definition: normalization, validation, required-ness, presentation.
Form-local by default, with no coupling to the form runtime. field-contracts/<field>.ts
(shape defined in field-contracts/shared/contract.ts)
Factories Composing contracts into form-wide defaults, schema, payload, and content - all typed against the canonical FormValues shape factories/
- default-values-factory.ts 
- validation-factory.ts          
- payload-factory.ts             
- content-factory.ts              
- submit-error-factory.ts      
Policies Conditional fields' rules - visibility and payload inclusion for fields whose presence depends on other fields or context policies.ts
Orchestration Async hydration of context (profile / config / settings etc)
Hands a render contract to the form orchestration layer
Form (renderer) Wiring only: binds contracts / factories / policies to the runtime and the inputs form renderer layer
Transport Form → request → response, response errors mapped back to form fields factories/submit-error-factory.ts - error key mapping)
Inputs Dumb, library-agnostic, presentational; render and report, decide nothing UI layer


Baseline directory layout example:




baseline-form-example/
├── field-contracts/             # per-field contracts
│   ├── shared/contract.ts        # FieldContractBase; validation and presentation shapes
│   ├── shared/guards.ts    # some shared contract utilities, eg. - for strings normalization etc
│   ├── username.ts      # per-field contract definitions
│   ├── email.ts
│   ├── phone-number.ts
│   ├── …etc.
├── factories/                   # contracts → form-wide concerns - each of those may use policies for cross-fields dependencies
│   ├── default-values-factory.ts  # seeds for eg. useForm({ defaultValuesFactory(context) }) with contracts and context
│   ├── validation-factory.ts           # zod schema per field + superRefine for conditional fields
│   ├── payload-factory.ts              # normalizes values → API request shape
│   ├── content-factory.ts              # resolves field labels and helper text from contracts
│   └── submit-error-factory.ts         # maps API error field names back to form field keys
├── policies.ts                  # conditional fields' rules
├── orchestrator.tsx             # async hydration + render contract
├── renderer.tsx                 # the form: pure wiring
└── types.ts                     # canonical field key set (FormValues); all factories typed against keyof FormValues


The field contract - the field's complete definition 


A contract is a plain object, and carries no dependency on the form runtime. Contracts are form-local by default - there is no expectation of sharing them across forms.
However, the absence of runtime coupling means they can be promoted to a shared field library when a genuine reuse case emerges, but that is an optimization, not a starting assumption.

A contract declares everything intrinsic to the field: how to coerce a raw value, how to derive its default from context, what makes it valid and whether it is required, and how to present it.



// field-contracts/shared/contract.ts
interface FieldContractBase<TName extends string, TValue, TContext> {
  name: TName
  normalizeValue: (value: unknown) => TValue
  defaultDataFactory: (context: TContext) => TValue
  validationSchemaFactory: (context: TContext) => ZodType<TValue>
  presentationFactory: (context: TContext) => FieldContent
}





// field-contracts/username.ts - static presentation
export const UsernameField = {
  name: "user_name",
  validationSchemaFactory: ({ usernameRegexp }) => z.string().trim().min(1, 'errors.username.required').regex(usernameRegexp, 'errors.username.invalid'),
  normalizeValue: (value: unknown) => isString(value) ? normalizeString(value) : '',
  defaultDataFactory: ({ profile }) => isString(profile.username) ? normalizeString(profile.username) : '',
  presentationFactory: ({ __, storeConfig }): FieldContent => ({
   label: storeConfig.allowEmptyFirstname ? __('contact_info.name') : __('contact_info.lastname'),
    placeholder: storeConfig.allowEmptyFirstname ? __('contact_info.name') : __('contact_info.lastname'),
 ....
  }), 
}



Note what is absent: no JSX, no visibility rule, no payload key.
As of the field names - they are form-specific by convention, so here they are co-located.

Validation messages are i18n keys, not user-facing strings ('errors.username.required', not 'Username is required'). The contract stays free of the i18n runtime; the renderer translates at the display boundary - error={error?.message && __(error.message)}. Parameterized messages (e.g. minimum lengths) carry a key plus params, resolved at the same boundary.



Factories - contracts become form-wide concerns

Each factory walks the contracts and assembles one pillar for the whole form, passing each contract only the context slice it needs:

Defaults:  defaultValuesFactory(context) calls every defaultDataFactory → the form's defaultValues.
Validation:  validationFactory(ctx) builds a z.object from each contract's validationSchemaFactory, then a superRefine handles conditional fields - gating on policy.visible and running the full field schema for each one. Cross-field rules that are not policy-driven also live in superRefine. Conditional fields are declared optional in the base z.object - their full schema runs only inside the superRefine gate; otherwise a hidden field would fail base validation before the policy is ever consulted.
Payload:  payloadFactory(values, profile)  normalizes through the contracts and applies payloadCondition policies to decide inclusion. The factory's return value is checked against the backend-provided request type with satisfies (generated from the API spec where available, otherwise a shared hand-declared request type): a wrong key, a wrong type, or a missing required field is a compile error. export type OnboardingPayload = ReturnType<typeof payloadFactory> remains available to consumers, but correctness flows from the API contract, not from the factory itself.
Content:  contentFactory(ctx) resolves presentation for all fields - calling each contract's presentationFactory(ctx) for context-dependent fields.
Submit errors:  submitErrorFactory(response) maps API field names back to form keys (email_address → email, country_code → country, …) so server errors land on the right field.
Each factory is consumed independently at a different point in the form lifecycle - defaults at initialization, schema at the resolver, payload at submit, content at render.
No shared execution path would catch a field mismatch between them at runtime. The type constraint is therefore the structural counterpart to the separation: the defaults, validation, and content factories are parameterized by keyof FormValues, declared once in types.ts.
Add a field to FormValues and TypeScript reports a compile error in each of those factories if it does not handle it.
The payload factory is the deliberate exception: its keys follow the API's naming, not the form's, so it cannot be constrained by keyof FormValues. Its output is constrained by the backend request type via satisfies, and its input coverage by the typed FormValues argument.


Side note - the field layer (optional; to be expanded)

When inputs don't conform to the uniform prop shape, or the input-adjacent markup (label, error, helper text) makes the renderer noisy, those concerns move into form-local field components - fields/<field>.tsx, the component counterpart of the field contract, typed against its exact contract. Controllers stay on the form level: the renderer binds and hands the field component the controlled wiring; the field owns adapting a non-conforming input to that wiring and composing the input-adjacent presentation. It may translate prop and event shapes, never value semantics - normalization stays on the contract, and all dumb-component rules still apply. Structurally optional; expected in practice past trivial form size. When a form needs fields, introducing them changes the structure a bit - the field and its contract sit together in a single folder (field-contracts/ becomes fields/, contract and component as sibling files) - but that is just a matter of renaming directories; nothing architectural moves.



Static vs. dynamic field sets


The keyof FormValues constraint assumes a statically declared field set - the form knows its fields at compile time, and TypeScript enforces exhaustiveness across all factories. This is the expected mode for domain-owned forms.

For CMS-driven or dynamically configured forms (e.g. contact forms where the field list arrives at runtime), the architecture is structurally identical - contracts, factories, policies, and the orchestrator / renderer split all apply - but FormValues is necessarily a loose record type, and field-to-contract dispatch happens dynamically (e.g. by inputType). Compile-time exhaustiveness is replaced by runtime contract coverage, the separation of concerns and testability guarantees remain unchanged.

Policies - conditional field participation rules


Policies exist for one purpose: declaring the conditions under which a field participates in the form. They apply only to conditional fields - fields whose presence depends on other field values or external context.
Unconditional fields have no policy entry, they are always present and their contracts fully describe them.

A policy has two baseline predicates: visible (whether the field renders) and payloadCondition (whether it is included in the submit payload). Both are declared explicitly. In the common case they are the same condition - that repetition is accepted deliberately, in exchange for a policy map that is plain, fully explicit data with no declaration-time helper between the author and the shape.
There could be other conditional aspects of a field, like required, so those could be added into policies if such need arises.

Hidden-field value retention is also declared here: an optional retainValueWhenHidden flag controls whether a hidden field keeps its value in form state (the default is unmount + unregister - the value is dropped). Whether a specific field should retain its value is a product decision, made per field; the framework only guarantees there is exactly one declared place to make it.

Note: required-ness is not in the policy by default - it is declared on the field contract validation and is intrinsic to the field. A conditional field that renders is required or not according to its own contract. The exception - a field that can be visible but optionally required based on context - adds an explicit required predicate to its policy entry. That is a deliberate override, not the default shape.





type FieldPolicy<TDeps extends readonly (keyof FormValues)[]> = {
  deps: TDeps
  visible: (values: Pick<FormValues, TDeps[number]>, context: PolicyContext) => boolean
  payloadCondition: (values: Pick<FormValues, TDeps[number]>, context: PolicyContext) => boolean
}

export const FIELD_POLICIES: {
  [CompanyName.name]: FieldPolicy<[typeof AccountType.name]>
  [State.name]: FieldPolicy<[typeof Country.name]>
  [PhoneNumber.name]: FieldPolicy<[typeof PreferredContact.name, typeof Country.name]>
} = {
  [CompanyName.name]: {
    deps: [AccountType.name],
    visible: (values) => values[AccountType.name] === 'company',
    payloadCondition: (values) => values[AccountType.name] === 'company',
  },
  [State.name]: {
    deps: [Country.name],
    visible: (values) => values[Country.name] === 'US',
    payloadCondition: (values) => values[Country.name] === 'US',
  },
  [PhoneNumber.name]: {
    deps: [PreferredContact.name, Country.name],
    visible: (values) => values[PreferredContact.name] === 'sms' && values[Country.name] === 'US',
    payloadCondition: (values) => values[PreferredContact.name] === 'sms' && values[Country.name] === 'US',
  },
}


Predicates receive the form values their deps declare (and the resolved external context, when a policy needs it). deps declares which form values a policy depends on - it documents the dependency and drives the renderer's subscription.
The per-entry tuple annotation is load-bearing: it is what links deps to the values a predicate may read, so the compiler rejects a predicate reading an undeclared field and a deps array that drifts from its annotation. Do not loosen the map's type to a uniform Record - that dissolves the link.

Every consumer evaluates a policy through a single entry point: evaluatePolicy(policy, values, context). The React layer uses a thin shared adapter, usePolicy(policy, control, context), which subscribes (useWatch) to exactly policy.deps and calls evaluatePolicy. No call site assembles a values or context slice by hand - which is what makes the guarantee real: the renderer, the validation gate, and the payload mapping cannot diverge on what a policy sees, because none of them decides what a policy sees.

Policies are the single source of truth for conditional participation, consumed independently by whichever factory needs it:


validationFactory - superRefine gates on policy.visible:



superRefine((values, ctx) => {
  const policy = evaluatePolicy(FIELD_POLICIES[CompanyName.name], values, formContext) // formContext: the ctx validationFactory was called with
  if (policy.visible) {
    const result = CompanyName.validationSchemaFactory().safeParse(values[CompanyName.name])
    result.error?.issues.forEach(issue => ctx.addIssue({ ...issue, path: [CompanyName.name] }))
  }
})


payloadFactory - payloadCondition gates field inclusion:



export const payloadFactory = (values: FormValues, context: PayloadContext) => {
  const companyNamePolicy = evaluatePolicy(FIELD_POLICIES[CompanyName.name], values, context)

  return {
    [Username.name]: Username.normalizeValue(values[Username.name]),
    [Email.name]: Email.normalizeValue(values[Email.name]),
    // conditional - included only when payloadCondition is met
    ...(companyNamePolicy.includeInPayload && {
      [CompanyName.name]: CompanyName.normalizeValue(values[CompanyName.name]),
    }),
  } satisfies CreateAccountRequest // backend-provided request type: generated from the API spec, or shared and hand-declared
}
etc.
 


Orchestration / renderer - context before the form renders

The orchestrator loads { profile, config, settings ... } asynchronously and passes the form a typed render contract containing the resolved context and the submit mutation.
The orchestrator never renders fields and holds no validation or payload logic.
It renders the form only once context is resolved - the form then seeds useForm a single time from defaultValuesFactory(context), and no re-seed (reset) path exists. The form operates on a snapshot of context taken at mount; live context updates mid-edit are out of scope.

The form renderer is a wiring layer, or the runtime adapter and contains no rules of its own.
It memoizes the schema from validationFactory, seeds useForm with defaultValuesFactory, resolves contentFactory, and binds each field with a Controller, never deciding anything.

Unconditional fields bind directly - required comes from the contract:





const fieldsPresentation = useMemo(() => contentFactory({ __, settings }), [__, settings])

<Controller name={UserName.name} control={control}
  render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
    <TextField 
  value={value}
  onBlur={onBlur}
  onChange={onChange}
  inputRef={ref}
       error={error?.message && __(error.message)}
  label={fieldsPresentation[UserName.name].label}
  required={fieldsPresentation[UserName.name].required} // visual indication only, derived in fieldsPresentation from validation schema factory
 />
  )}
/>


Conditional fields evaluate their policy through the shared usePolicy adapter, which subscribes to exactly the policy's declared deps:
 



const companyNamePolicy = usePolicy(FIELD_POLICIES[CompanyName.name], control, formContext)

{companyNamePolicy.visible && (
  <Controller name={CompanyName.name} control={control}
    render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
      <TextField
  value={value}
  onBlur={onBlur}
  onChange={onChange}
  inputRef={ref}
        error={error?.message && __(error.message)}
  label={fieldsPresentation[CompanyName.name].label}
        required={fieldsPresentation[CompanyName.name].required} />
    )} />
)}
Narrowing re-renders - optional (but welcome) optimization


The usePolicy subscription above re-renders the whole form component when any of its watched deps change. For most forms this is acceptable.
When a form has many fields or expensive subtrees, subscriptions can be narrowed so only the affected part re-renders.

Two approaches work. A narrow render-prop wrapper component owns its own useWatch and renders only its children when its specific dependencies change:
 



<ValueObserver control={control} observed={FIELD_POLICIES[CompanyName.name].deps}>
  {(observedValues) => {
    const policy = evaluatePolicy(FIELD_POLICIES[CompanyName.name], observedValues, formContext)
    return policy.visible && (
      <Controller name={CompanyName.name} control={control} render={…} />
    )
  }}
</ValueObserver>


Alternatively, conditional field groups can be extracted into separate child components that each own their own usePolicy call. Both achieve the same isolation; the choice depends on the form's structure.

This optimization is independent of the architecture - policy evaluation, validation, and payload mapping are unaffected either way.



Async validation - colocated with the contract, wired by convention


Async rules (username availability, address verification) do not fit the synchronous schema and are not forced into it. An async validator is a plain util colocated with the field contract - same file or a sibling - keeping the field's complete definition in one place without widening the contract interface:



// field-contracts/username.ts - colocated with the contract
export const validateUsernameAvailability = async (value: string, signal: AbortSignal): Promise<string | null> => {
  const { available } = await checkUsername(value, { signal })
  return available ? null : 'errors.username.taken'
}


It is a pure async function: value in, i18n error key or null out, cancellation via the passed AbortSignal. It is unit-testable with a stubbed transport and knows nothing about the form runtime.

The wiring conventions belong to the reactivity pillar and are uniform across forms:

- runs debounced on value change, and only after the field's synchronous schema passes - no availability check for a value that is locally invalid
- each run aborts the previous in-flight request (AbortController) - last write wins, stale responses never land
- the result surfaces via setError / clearErrors with a distinct error type (e.g. type: 'async'), so it composes with schema errors instead of fighting them
- submit is blocked while a check is pending or failed

These conventions are implemented once as a shared runtime utility (e.g. useAsyncFieldValidation(control, name, validator)) and reused; an individual form only picks the validator and the field.



Fields presentation - co-located with the field, aggregated by the factory



Labels, helper text, and placeholders are declared on the field contract itself as a presentationFactory. The definition lives with the field; nothing about a field's copy is declared elsewhere.

factories/content-factory.ts is a thin aggregation: it references each contract's presentationFactory(ctx) and returns a typed record keyed by field name. It re-creates no definitions - it only wires them together.
The form renderer calls contentFactory once, memoized, and passes resolved strings down to inputs as props. Inputs receive copy; they never resolve anything themselves.



Note on required indicator - derived, not declared


The required prop on an input is a visual affordance (typically an asterisk), not a validation rule. It is not declared independently - it is derived from the field's validation schema inside contentFactory:



export const contentFactory = (ctx) => ({
  [Username.name]: {
    ...resolvePresentation(Username, ctx),
    required: deriveRequired(Username, ctx), // shared/guards.ts
  },
  // …
})

// shared/guards.ts - probe the schema with the field's own empty value
export const deriveRequired = (contract, ctx) =>
  !contract.validationSchemaFactory(ctx).safeParse(contract.normalizeValue(undefined)).success
The probe value is not a hardcoded '' - it is the field's own empty value, produced by its normalizeValue(undefined): the value the form actually holds when the field is untouched and empty. The question the probe asks is therefore exact - "would this field, left empty, fail validation?" - and it generalizes across value types ('' for a string, false for a consent checkbox, undefined for a number). It relies on one convention that must hold anyway: an optional field's schema accepts that field's empty value, because pristine form state contains it.
The validation schema remains the only place required-ness is declared. The content factory derives the visual consequence: change the schema, and the asterisk follows automatically.

Transport - request boundary and error mapping back


The transport layer has two responsibilities and nothing else. A form-specific API client sends the normalized payload and returns a response - it knows nothing about the form.
submitErrorFactory maps API field names back to form field keys, and the form calls setError for each mapped error so server errors surface on the originating field.
The API client knows nothing about the form's field naming and the form knows nothing about the API's naming - submitErrorFactory is the only coupling point between them, and it is a pure function with no side effects.

End-to-end: one trip through the form
The pieces connect in a single, deterministic flow - each arrow crosses exactly one boundary, and each boundary is owned by exactly one part:

Hydrate -  orchestration.tsx loads data and renders the form only once context is resolved, handing it a render contract (context + a submit mutation).
Default -  useForm seeds once from defaultValuesFactory(formContext); the form never re-seeds, and works on the context snapshot taken at mount. Source of each value (static / profile / config) lives in the contract, independent of how it's later judged or sent.
Render & edit -  Controller binds each contract to a dumb input; copy comes from contentFactory. Conditional fields render based on policy.visible, re-evaluated when their dependency changes.
Validate -  validationFactory schema runs on the RHF cadence (mode: onBlur, reValidateMode: onChange); conditional field validation is gated by policy.visible in superRefine, which runs each field's complete schema.
Submit → payload -  payloadFactory(values, profile) normalizes and applies payloadCondition policies to decide inclusion; its return type is the request payload type.
Transport - the API client sends the request and returns a response.
Map back - submitErrorFactory translates API field names to form keys and the form calls setError for each, so server errors surface on the originating field.
Multi-step flows
Multi-step forms (wizards, funnels) are not a separate architecture - they are the baseline form applied per step, with step values merged at submit.



One form per step, merged at submit


Each step is an independent form with its own useForm, its own field contracts, its own validationFactory, and its own contentFactory. Completed step values are accumulated in external state (context, store, or parent component state). The final step merges all collected values, runs payloadFactory over the merged result, and submits.

This is the approach documented by both major form libraries:

RHF: Wizard Form / Funnel - accumulate step data in external state, submit from the final step.
TanStack Form: Multi-Step Wizard example - separate form instances per step with shared state.
Each step validates only its own fields by design - no partial validation of a larger schema, no gating logic to decide which subset of fields to trigger. A step is complete when its own form submits successfully.



What changes relative to the baseline


Step descriptor - declares the step order, labels, and which step is active. Navigation logic lives in the orchestrator, not in individual step forms.
Accumulated values - an external store (or parent state) holds completed step results. Each step's submit handler writes its values into the store and advances.
Payload composition - payloadFactory operates over the merged values from all steps rather than a single form's values. It runs once at final submit.
Back navigation - returning to a completed step re-initializes that step's form with the previously submitted values from the store as defaultValues.
Cross-step dependencies - if a later step needs values from a previous step (e.g. to derive defaults, resolve conditional presentation, or gate policies), those values are available in the accumulated store and can be passed as context to defaultValuesFactory, contentFactory, validationFactory, or policies - the same context mechanism used for profile/config in single-step forms.

What stays the same


Field contracts define fields. Factories compose them. Policies gate conditional participation. The orchestrator owns context and the submit mutation. Inputs remain dumb. The only structural addition is the step store and the navigation between independent forms.

Testing strategy


The layered structure means that the overwhelming majority of a form's logic lives in plain functions and objects - field contracts, factories, and policies - all of which are testable without rendering, without providers, and without mocking modules. The form renderer by design holds no logic to test beyond basic wiring.



No module mocking

Every layer receives its dependencies as arguments (context, values, config). There is nothing to mock - you call the function with test data and assert the output. Field contracts are plain objects with pure functions. Factories take context and return data. Policies are functions that take field values and return booleans. All are tested as expect(fn(input)).toEqual(output).



No rendering for logic tests

Validation, defaults, payload mapping, policies, normalization, presentation - all testable as synchronous pure function calls. The logic test surface requires no React, no form library, no DOM, and no providers. A change to a validation rule or a policy is verified by a unit test against that specific function.



Render tests stay thin and stable

The renderer holds no logic, so render tests only verify wiring: does the right field appear, does the right label show, does conditional visibility respond to value changes, does submit invoke the mutation. These tests are few and change only when fields are added or layout changes - not when rules change.



Policies are tested once, consumed everywhere

A single policy test covers visibility, validation gating, and payload inclusion simultaneously - because all three consumers evaluate the same policy through the same entry point (evaluatePolicy), and the policy itself owns which values and context it reads. Change a policy, update one test, all three behaviors follow.