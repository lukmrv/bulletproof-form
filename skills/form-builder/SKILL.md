---
name: form-builder
description: Build or refactor forms with strict field/form/payload layering. Use when adding fields, changing intrinsic field contracts, changing form-level cross-field logic, updating defaults/validation/payload composition, or aligning implementation with API contracts.
---

# Layered Form Builder

## Use this skill when

- A form field is added, removed, or changed.
- Field-level validation/default/normalization logic changes.
- Cross-field dependency or form-level policy logic changes.
- Form lifecycle logic changes (bootstrap defaults, reset flow, submit orchestration).
- Payload mapping rules change due to backend contract expectations.
- Project guidance in `README.md` must be realigned with implementation.

## Core Model

1. Field UI layer owns rendering and input wiring only.

- UI fields stay form-library-agnostic where possible (`value`, `onChange`, `onBlur`, `ref`, `error`).
- UI fields do not own validation/default/payload behavior.

2. Field contract layer owns intrinsic single-field behavior.

- Each field contract should expose intrinsic rules only:
  validation (schema or factory), normalize, default.
- Keep cross-field dependency logic out of field contracts.
- Prefer one shared contract interface so every field has consistent shape.
- Enumerated options (select/radio) should be owned by field contracts and passed to UI fields.

3. Form composition layer owns cross-field behavior.

- Compose field contracts into:
  - default values factory
  - validation factory
  - optional policy map (for `visible`, `required`, `includeInPayload`)
- Cross-field and policy-driven requirements belong in form-level validation
  (`superRefine` or equivalent), not in field contracts.
- Conditional rendering should read the same policy/context model used in validation and payload.
- Step-based forms should define explicit step constants with stable `id`, `label`, and `fields`.
  Render each step branch directly when steps need product-specific adjustment. Step navigation
  should validate only the active step fields, while final submit validates the full form and uses
  the same payload factory.
- Data orchestration may be extracted when multiple demos share bootstrap context and a submit
  mutation dependency. Library-specific setup (`useForm`, resolver initialization, reset hydration,
  and `handleSubmit`) belongs in the concrete renderer.
- Orchestrators may initialize API clients from app/runtime context, but should pass narrow
  operations such as `saveInvoice` or `saveOnboarding`, not broad clients, into concrete renderers.
- Submit should use an IoC boundary where concrete renderers map form values to payload, call the
  orchestrator-provided mutation with `{ payload, headers }`, normalize the returned response
  through a form-level submit error factory, and adapt normalized errors to field/form UI.

4. Payload layer owns submit shape and include/omit behavior.

- Payload mapping is explicit, normalized, and aligned with backend contract expectations.
- Conditional fields must be gated deterministically in payload assembly.
- Prefer deriving payload type from payload factory return type.
- Submit error mapping belongs in a form-level factory when it translates API/payload error keys to
  form field names.
- Keep backend error keys explicit in submit error factories when they differ from form field names
  (for example `email_address` -> `email`).
- Submit error application belongs in the concrete renderer or form-library adapter when it needs
  APIs such as `setError`.

5. Defaults/context should have a single source of truth.

- Centralize fallback defaults used by form initialization and validation behavior.
- Avoid duplicating inline fallback literals across multiple files.

6. Hidden fields must not leak into submit.

- Conditional fields should be unmounted when hidden.
- Hidden/unmounted fields must be removed from form state
  (for React Hook Form, this is `shouldUnregister: true`).
- Payload mapping should still gate optional fields via policy-driven include/omit.

7. Granular sync owns patch lifecycle, not field contracts.

- Draft autosave and server patch flows should use a sync adapter boundary.
- Sync adapters receive changed field names, current values, and policy/context.
- Sync orchestration should debounce changes, track per-field status, and ignore stale async
  responses.
- Keep sync transport examples separate when they teach different backend semantics.

## Suggested File Organization (adapt naming to repo conventions)

- `fields/`: UI field components.
- `field-contracts/`: intrinsic field contracts.
- `field-contracts/shared/`: shared contract interfaces/guards.
- `policies/` or `policies.ts`: conditional field policy rules.
- `factories/default-values*`: default value composition.
- `factories/validation*`: schema composition and cross-field refinement.
- `factories/payload*`: payload mapping and include/omit logic.
- `factories/submit-error*`: API/payload error key to form field error mapping.
- `steps/`: wizard step constants and step-flow helpers.
- `sync/`: granular sync adapters, status tracking, and stale-response sequencing.
- `default-context*`: centralized defaults and baseline context.

## Change Map

### Add a field

- field UI module
- form-local field contract module
- form values type module
- defaults aggregation module
- validation composition module
- payload mapping module
- form renderer/orchestration module

### Add a conditional field

- Add/extend a policy rule for visibility/required/payload inclusion.
- Use that rule in conditional rendering.
- Add required-if-needed cross-field validation in form-level validation.
- Add include/omit gating in payload mapping.

### Add a step

- Add an explicit step constant with stable `id`, `label`, and owned field names.
- Render the step's field controllers directly in the concrete renderer; do not duplicate
  validation/default/payload rules.
- Validate active step fields before moving forward.
- Keep final submit on the full form resolver and payload factory.

### Add granular sync

- Add or reuse a sync adapter for the transport shape.
- Patch only dirty changed fields.
- Track per-field `idle | pending | synced | failed` state.
- Protect against stale responses before applying success/failure state.

## Drift Prevention Checklist

- Conditional fields are aligned in all four places:
  policies, conditional rendering, cross-field validation, payload mapping.
- One shared defaults source exists for fallback context/settings.
- Contract interfaces are enforced consistently across all field contracts.
- Options stay in field contracts, not UI field components.
- Cross-field logic does not leak into field contracts.
- Step fields match actual form field names.
- Sync examples do not mutate payload semantics.

## Verification

- Run the project quality gates for the changed form app/workspace.
- Minimum recommended:

```bash
npm run format:check
npm run test
npm run typecheck
npm run build
```
