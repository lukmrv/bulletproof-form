import { AccountTypeField } from './field-contracts/account-type'
import { CompanyNameField } from './field-contracts/company-name'
import { CountryField } from './field-contracts/country'
import { PhoneNumberField } from './field-contracts/phone-number'
import { PreferredContactField } from './field-contracts/preferred-contact'
import { StateField } from './field-contracts/state'
import type { SimpleOnboardingFormValues } from './types'
import type { Profile } from './default-context'

/*
  FIELD_POLICIES owns conditional field participation rules — the conditions
  under which a field takes part in the form at all:
  - visible: should the field render in the UI
  - payloadCondition: should the field be included in the submit payload
  Both predicates are declared explicitly; when they repeat the same condition
  that repetition is deliberate — the policy map stays plain, fully explicit
  data with no declaration-time helper.
  Unconditional fields have no policy entry; their contracts fully describe them.

  `deps` declares which form values a policy reads. It documents the dependency
  and drives the renderer's subscription — no call site assembles a values slice
  by hand, so the renderer, the validation gate, and the payload mapping cannot
  diverge on what a policy sees. The per-entry FieldPolicy<[…]> annotation on
  FIELD_POLICIES is load-bearing: it links each deps tuple to the values its
  predicates may read, so the compiler rejects a predicate reading an undeclared
  field and a deps array that drifts from its annotation. Never loosen the map's
  type to a uniform Record.

  Every consumer evaluates a policy through the single entry point
  `evaluatePolicy(policy, values, context)`.

  Hidden-field value retention would also be declared here (an optional
  retainValueWhenHidden flag); the baseline — and every field in this form —
  is unmount + unregister, so no entry carries it.

  Required-ness is NOT a policy concern: it is intrinsic to the field and lives
  on the contract's validation schema. A conditional field that renders is
  required or not according to its own contract. (A field that is visible but
  only contextually required would add an explicit `required` predicate to its
  entry — a deliberate override, not the default shape.)
*/

export interface PolicyContext {
  profile: Profile
}

type PolicyDep = keyof SimpleOnboardingFormValues

type FieldCondition<TDeps extends readonly PolicyDep[]> = (
  values: Pick<SimpleOnboardingFormValues, TDeps[number]>,
  context: PolicyContext,
) => boolean

export interface FieldPolicy<TDeps extends readonly PolicyDep[]> {
  deps: TDeps
  visible: FieldCondition<TDeps>
  payloadCondition: FieldCondition<TDeps>
}

export interface EvaluatedFieldPolicy {
  visible: boolean
  includeInPayload: boolean
}

export function evaluatePolicy<TDeps extends readonly PolicyDep[]>(
  policy: FieldPolicy<TDeps>,
  values: Pick<SimpleOnboardingFormValues, TDeps[number]>,
  context: PolicyContext,
): EvaluatedFieldPolicy {
  return {
    visible: policy.visible(values, context),
    includeInPayload: policy.payloadCondition(values, context),
  }
}

export const FIELD_POLICIES: {
  [CompanyNameField.name]: FieldPolicy<[typeof AccountTypeField.name]>
  [StateField.name]: FieldPolicy<[typeof CountryField.name]>
  [PhoneNumberField.name]: FieldPolicy<
    [typeof PreferredContactField.name, typeof CountryField.name]
  >
} = {
  [CompanyNameField.name]: {
    deps: [AccountTypeField.name],
    visible: (values) => values[AccountTypeField.name] === 'company',
    payloadCondition: (values) => values[AccountTypeField.name] === 'company',
  },
  [StateField.name]: {
    deps: [CountryField.name],
    visible: (values) => values[CountryField.name] === 'US',
    payloadCondition: (values) => values[CountryField.name] === 'US',
  },
  [PhoneNumberField.name]: {
    deps: [PreferredContactField.name, CountryField.name],
    visible: (values) =>
      values[PreferredContactField.name] === 'sms' && values[CountryField.name] === 'US',
    payloadCondition: (values) =>
      values[PreferredContactField.name] === 'sms' && values[CountryField.name] === 'US',
  },
}
