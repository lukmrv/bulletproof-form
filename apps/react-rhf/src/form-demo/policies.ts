import type { SimpleOnboardingFormValues } from './types'
import type { Profile } from './default-context'

/*
  FIELD_POLICIES owns context-dependent field participation rules:
  - visible: should the field render in the UI
  - required: should a missing value fail validation
  - payloadCondition: should the field be included in submit payload
  It does not define intrinsic field validity (type/format/range).
*/

interface PolicyContext {
  profile: Profile
}

type FieldPolicyContextMap = {
  company_name: Pick<SimpleOnboardingFormValues, 'account_type'> & PolicyContext
  state: Pick<SimpleOnboardingFormValues, 'country'> & PolicyContext
  phone_number:
    & Pick<SimpleOnboardingFormValues, 'preferred_contact' | 'country'>
    & PolicyContext
}

type FieldCondition<TPolicyContext> = (policyContext: TPolicyContext) => boolean

type ConditionalFieldRule<TPolicyContext> = {
  visible: FieldCondition<TPolicyContext>
  required: FieldCondition<TPolicyContext>
  payloadCondition: FieldCondition<TPolicyContext>
}

type ConditionalFieldRulesMap = {
  [TFieldName in keyof FieldPolicyContextMap]: ConditionalFieldRule<
    FieldPolicyContextMap[TFieldName]
  >
}

interface ConditionalFieldPolicy {
  visible: boolean
  required: boolean
  includeInPayload: boolean
}

export function buildConditionalFieldPolicy<TPolicyContext>(
  rule: ConditionalFieldRule<TPolicyContext>,
  policyContext: TPolicyContext,
): ConditionalFieldPolicy {
  return {
    visible: rule.visible(policyContext),
    required: rule.required(policyContext),
    includeInPayload: rule.payloadCondition(policyContext),
  }
}

export const FIELD_POLICIES: ConditionalFieldRulesMap = {
  company_name: {
    visible: (policyContext) => policyContext.account_type === 'company',
    required: (policyContext) => policyContext.account_type === 'company',
    payloadCondition: (policyContext) => policyContext.account_type === 'company',
  },
  state: {
    visible: (policyContext) => policyContext.country === 'US',
    required: (policyContext) => policyContext.country === 'US',
    payloadCondition: (policyContext) => policyContext.country === 'US',
  },
  phone_number: {
    visible: (policyContext) =>
      policyContext.preferred_contact === 'sms' && policyContext.country === 'US',
    required: (policyContext) =>
      policyContext.preferred_contact === 'sms' && policyContext.country === 'US',
    payloadCondition: (policyContext) =>
      // additional condition may be added if necessary / based on a different context e.g. settings
      policyContext.preferred_contact === 'sms' && policyContext.country === 'US',
  },
}
