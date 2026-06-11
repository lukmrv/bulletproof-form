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
    (defaults to `visible`; declared explicitly only when render participation
    and payload participation genuinely diverge)
  Unconditional fields have no policy entry; their contracts fully describe them.

  `deps` declares which form values a policy reads. It documents the dependency
  and drives the renderer's subscription — no call site assembles a values slice
  by hand, so the renderer, the validation gate, and the payload mapping cannot
  diverge on what a policy sees.

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

interface ConditionalFieldRule<TDeps extends readonly PolicyDep[]> {
  deps: TDeps
  visible: FieldCondition<TDeps>
  payloadCondition?: FieldCondition<TDeps>
}

export interface FieldPolicy<TDeps extends readonly PolicyDep[]> {
  deps: TDeps
  visible: FieldCondition<TDeps>
  payloadCondition: FieldCondition<TDeps>
}

export interface EvaluatedFieldPolicy {
  visible: boolean
  includeInPayload: boolean
}

export function definePolicy<const TDeps extends readonly PolicyDep[]>(
  rule: ConditionalFieldRule<TDeps>,
): FieldPolicy<TDeps> {
  return {
    deps: rule.deps,
    visible: rule.visible,
    payloadCondition: rule.payloadCondition ?? rule.visible,
  }
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

export const FIELD_POLICIES = {
  [CompanyNameField.name]: definePolicy({
    deps: [AccountTypeField.name],
    visible: (values) => values[AccountTypeField.name] === 'company',
    // payloadCondition omitted — defaults to visible
  }),
  [StateField.name]: definePolicy({
    deps: [CountryField.name],
    visible: (values) => values[CountryField.name] === 'US',
  }),
  [PhoneNumberField.name]: definePolicy({
    deps: [PreferredContactField.name, CountryField.name],
    visible: (values) =>
      values[PreferredContactField.name] === 'sms' && values[CountryField.name] === 'US',
  }),
}
