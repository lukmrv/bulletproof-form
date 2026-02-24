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

4. Payload layer owns submit shape and include/omit behavior.

- Payload mapping is explicit, normalized, and aligned with backend contract expectations.
- Conditional fields must be gated deterministically in payload assembly.
- Prefer deriving payload type from payload factory return type.

5. Defaults/context should have a single source of truth.

- Centralize fallback defaults used by form initialization and validation behavior.
- Avoid duplicating inline fallback literals across multiple files.

6. Hidden fields must not leak into submit.

- Conditional fields should be unmounted when hidden.
- Hidden/unmounted fields must be removed from form state
  (for React Hook Form, this is `shouldUnregister: true`).
- Payload mapping should still gate optional fields via policy-driven include/omit.

## Suggested File Organization (adapt naming to repo conventions)

- `fields/`: UI field components.
- `field-contracts/`: intrinsic field contracts.
- `field-contracts/shared/`: shared contract interfaces/guards.
- `policies/` or `policies.ts`: conditional field policy rules.
- `factories/default-values*`: default value composition.
- `factories/validation*`: schema composition and cross-field refinement.
- `factories/payload*`: payload mapping and include/omit logic.
- `default-context*`: centralized defaults and baseline context.

## Change Map

### Add a field

- field UI module
- form-local field contract module
- form values type module
- defaults aggregation module
- validation composition module
- payload mapping module
- form orchestration module

### Add a conditional field

- Add/extend a policy rule for visibility/required/payload inclusion.
- Use that rule in conditional rendering.
- Add required-if-needed cross-field validation in form-level validation.
- Add include/omit gating in payload mapping.

## Drift Prevention Checklist

- Conditional fields are aligned in all four places:
  policies, conditional rendering, cross-field validation, payload mapping.
- One shared defaults source exists for fallback context/settings.
- Contract interfaces are enforced consistently across all field contracts.
- Options stay in field contracts, not UI field components.
- Cross-field logic does not leak into field contracts.

## Verification

- Run the project quality gates for the changed form app/workspace.
- Minimum recommended:

```bash
npm run format:check
npm run typecheck
npm run build
```
