# Bulletproof Forms

A reference project for building robust, layered forms that can be adapted to different form
libraries and UI stacks.

## Project Layout

- `skills/layered-form-builder`: local skill for LLM-guided form changes.
- `apps/react-rhf`: implemented layered baseline.
- `apps/react-tanstack`: deferred scaffold.
- `apps/svelte`: deferred scaffold.

## Current Baseline

Implemented:

- `react-rhf` with explicit field/form/payload layering.
- Async bootstrap hydration via a single `reset(...)` path.
- Form policies with explicit `formPolicyContext` threading across UI, validation, and payload
  mapping.
- Submit boundary built from `validationFactory -> payloadFactory` (no API integration layer in
  baseline).
- Additional `form-demo-max` stress test with dense conditional dependencies and policy-driven
  include/omit behavior.
- Typecheck/build/lint/format scripts for `react-rhf`.

## Architecture Rules

1. Field UI layer owns rendering and input wiring only.

- Reusable field components stay library-agnostic (`value`, `onChange`, `onBlur`, `ref`, `error`).
- No validation/default/payload logic inside UI field modules.

2. Form-local field contracts own intrinsic value behavior.

- Each form defines `field-contracts` for intrinsic defaults, intrinsic validation, and intrinsic
  normalization.
- Select/radio option lists are defined in field contracts and passed into UI field components.
- Contracts are shareable when semantics align, but local-by-default to avoid accidental coupling.

3. Form layer owns composition and cross-field behavior.

- `defaultValuesFactory`, `validationFactory`, orchestration, conditional rendering.
- `policies.ts` owns visibility/required/payload-condition logic.

4. Payload layer owns final submit mapping.

- `payloadFactory` normalizes and explicitly includes/omits fields.

5. Keep type ownership direct.

- Domain primitives from `src/domain/primitives.ts`.
- Payload shape from `ReturnType<typeof payloadFactory>`.

## Change Workflow

1. Identify layer ownership for the requested change.
2. Update the owning module first (field/policies/payload/form orchestration).
3. Update dependent composition modules.
4. Keep `README.md` and `skills/layered-form-builder/SKILL.md` in sync with behavior.
5. Run verification commands.

## Verification

From repo root:

```bash
npm --workspace @bulletproof-forms/react-rhf run typecheck
npm --workspace @bulletproof-forms/react-rhf run build
npm --workspace @bulletproof-forms/react-rhf run lint
npm --workspace @bulletproof-forms/react-rhf run format:check
```

## Run Baseline

From repo root:

```bash
npm run dev:react-rhf
```


## TODO

- Add a step-based forms pattern (multi-step orchestration, step-local validation, and
  cross-step policy/payload composition).