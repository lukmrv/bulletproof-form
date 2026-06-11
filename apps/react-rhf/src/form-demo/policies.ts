import { CompanyNameField } from './field-contracts/company-name'
import { PhoneNumberField } from './field-contracts/phone-number'
import { StateField } from './field-contracts/state'
import type { SimpleOnboardingFormValues } from './types'
import type { Profile } from './default-context'

/*
  FIELD_POLICIES owns conditional field participation rules — the conditions
  under which a field takes part in the form at all:
  - visible: should the field render in the UI
  - payloadCondition: should the field be included in the submit payload
  Unconditional fields have no policy entry; their contracts fully describe them.

  Required-ness is NOT a policy concern: it is intrinsic to the field and lives
  on the contract's validation schema. A conditional field that renders is
  required or not according to its own contract. (A field that is visible but
  only contextually required would add an explicit `required` predicate to its
  entry — a deliberate override, not the default shape.)
*/

interface PolicyContext {
  profile: Profile
}

type FieldPolicyContextMap = {
  [CompanyNameField.name]:
    & Pick<SimpleOnboardingFormValues, 'account_type'>
    & PolicyContext
  [StateField.name]: Pick<SimpleOnboardingFormValues, 'country'> & PolicyContext
  [PhoneNumberField.name]:
    & Pick<SimpleOnboardingFormValues, 'preferred_contact' | 'country'>
    & PolicyContext
}

type FieldCondition<TPolicyContext> = (policyContext: TPolicyContext) => boolean

type ConditionalFieldRule<TPolicyContext> = {
  visible: FieldCondition<TPolicyContext>
  payloadCondition: FieldCondition<TPolicyContext>
}

type ConditionalFieldRulesMap = {
  [TFieldName in keyof FieldPolicyContextMap]: ConditionalFieldRule<
    FieldPolicyContextMap[TFieldName]
  >
}

interface ConditionalFieldPolicy {
  visible: boolean
  includeInPayload: boolean
}

export function buildConditionalFieldPolicy<TPolicyContext>(
  rule: ConditionalFieldRule<TPolicyContext>,
  policyContext: TPolicyContext,
): ConditionalFieldPolicy {
  return {
    visible: rule.visible(policyContext),
    includeInPayload: rule.payloadCondition(policyContext),
  }
}

export const FIELD_POLICIES: ConditionalFieldRulesMap = {
  [CompanyNameField.name]: {
    visible: (policyContext) => policyContext.account_type === 'company',
    payloadCondition: (policyContext) => policyContext.account_type === 'company',
  },
  [StateField.name]: {
    visible: (policyContext) => policyContext.country === 'US',
    payloadCondition: (policyContext) => policyContext.country === 'US',
  },
  [PhoneNumberField.name]: {
    visible: (policyContext) =>
      policyContext.preferred_contact === 'sms' && policyContext.country === 'US',
    payloadCondition: (policyContext) =>
      // additional condition may be added if necessary / based on a different context e.g. settings
      policyContext.preferred_contact === 'sms' && policyContext.country === 'US',
  },
}
