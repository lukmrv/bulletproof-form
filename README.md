# Bulletproof Forms

A reference project for building robust, layered forms that can be adapted to different form
libraries and UI stacks.

## Project Layout

- `skills/form-builder`: local skill for LLM-guided form changes.
- `apps/react-rhf`: the layered baseline form (React Hook Form).

## Current Baseline

Implemented:

- `react-rhf` single-page baseline form with explicit field/form/payload layering.
- Field contracts that carry the field's canonical `name`, intrinsic validation, normalization,
  default derivation, and presentation. Every other layer references fields as `Field.name`.
- Async bootstrap hydration via a single `reset(...)` path, with the form disabled while hydrating.
- Form policies (`visible`, `payloadCondition`) consumed by conditional rendering, validation
  gating, and payload inclusion.
- Validation composed per contract; conditional fields run their full contract schema in
  `superRefine`, gated on `policy.visible`.
- Submit boundary built from `validationFactory -> payloadFactory` (mock API client in baseline).
- Shared onboarding data orchestrator for bootstrap, context, and the submit mutation dependency.
- Submit mutation IoC accepts `{ payload, headers }`; response mapping is normalized by a
  form-level submit error factory before RHF applies errors.
- Submit error keys may follow backend naming such as `email_address` while form field names stay
  local to the form.
- Typecheck/build/test/lint/format scripts for `react-rhf`.

## Architecture Rules

1. Field UI layer owns rendering and input wiring only.

- Reusable field components stay library-agnostic (`value`, `onChange`, `onBlur`, `ref`, `error`).
- No validation/default/payload logic inside UI field modules.

2. Form-local field contracts own intrinsic field behavior.

- Each form defines `field-contracts` carrying the canonical field `name`, intrinsic defaults,
  intrinsic validation (including required-ness), and intrinsic normalization.
- Required-ness is intrinsic to the field: it lives on the contract's validation schema, and the
  required indicator is derived from that schema, never declared independently.
- Select/radio option lists are defined in field contracts and passed into UI field components.
- Contracts are shareable when semantics align, but local-by-default to avoid accidental coupling.

3. Form layer owns composition and cross-field behavior.

- `defaultValuesFactory`, `validationFactory`, renderer-local form setup, conditional rendering.
- `policies.ts` owns conditional field participation: `visible` and `payloadCondition`. A field
  that is visible but only contextually required adds an explicit `required` predicate as a
  deliberate override — it is not part of the default policy shape.
- Conditional field validation is gated on `policy.visible` in `superRefine`, which runs the
  field's complete contract schema. Cross-field rules that are not policy-driven also live there.

4. Payload layer owns final submit mapping.

- `payloadFactory` normalizes through the contracts and gates conditional fields purely via
  `payloadCondition` policies.
- Form-level submit error factories map API/payload error keys to form field names.
- Concrete renderers adapt normalized submit errors to form-library behavior such as `setError`.

5. Keep type ownership direct.

- The canonical field key set (`FormValues`) lives in `types.ts`; factories are typed against
  `keyof FormValues` so adding a field produces a compile error in every factory that does not
  handle it.
- Payload shape from `ReturnType<typeof payloadFactory>`.

## Change Workflow

1. Identify layer ownership for the requested change.
2. Update the owning module first (field/policies/payload/form orchestration).
3. Update dependent composition modules.
4. Keep `README.md` and `skills/form-builder/SKILL.md` in sync with behavior.
5. Run verification commands.

## Verification

From repo root:

```bash
npm --workspace @bulletproof-forms/react-rhf run typecheck
npm --workspace @bulletproof-forms/react-rhf run test
npm --workspace @bulletproof-forms/react-rhf run build
npm --workspace @bulletproof-forms/react-rhf run lint
npm --workspace @bulletproof-forms/react-rhf run format:check
```

## Run Baseline

From repo root:

```bash
npm run dev:react-rhf
```

## Next Gaps

- Multi-step flows: one independent form per step with values accumulated in external state and
  merged at final submit (not a single form with step-conditional rendering).
- Replace the mock API client with a real transport when backend contracts exist.
- Add browser-level coverage for conditional field visibility and submit wiring.
