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
- Shared onboarding data orchestrator for bootstrap, context, and the submit mutation dependency.
- Orchestrator example initializes a mock `OnboardingApiClient` class and passes its save operation
  to concrete renderers.
- Concrete RHF renderers own `useForm`, resolver/default initialization, reset hydration, submit
  wiring, payload mapping, and explicit field rendering.
- Submit mutation IoC accepts `{ payload, headers }`; response mapping is normalized by a
  form-level submit error factory before RHF applies errors.
- Submit error keys may follow backend naming such as `email_address` while form field names stay
  local to the renderer.
- Demo shell for the RHF examples:
  - baseline single-page form
  - linear wizard with step-local validation
  - draft autosave with debounced dirty-field sync
  - server patch with per-field pending/synced/failed state
- Typecheck/build/test/lint/format scripts for `react-rhf`.

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

- `defaultValuesFactory`, `validationFactory`, renderer-local form setup, conditional rendering.
- `policies.ts` owns visibility/required/payload-condition logic.
- Explicit step constants and renderer branches own wizard steps and step-local field groups.
- Granular sync orchestration owns dirty-field patching, debounce, per-field status, and stale
  response protection.

4. Payload layer owns final submit mapping.

- `payloadFactory` normalizes and explicitly includes/omits fields.
- Concrete renderers map form values to payload before calling the orchestrator-provided mutation.
- Form-level submit error factories map API/payload error keys to form field names.
- Concrete renderers adapt normalized submit errors to form-library behavior such as `setError`.

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

- Add branching step examples once linear step orchestration needs conditional step inclusion.
- Replace mock sync transports with real API adapters when backend contracts exist.
- Add browser-level coverage for navigation and visible conditional fields.
