import type { SimpleOnboardingFormValues } from '../types'
import type { StepDescriptor } from './step-flow'

export type OnboardingStepField = keyof SimpleOnboardingFormValues
export type OnboardingStepId = 'identity' | 'account' | 'contact'

export interface OnboardingStepDescriptor extends StepDescriptor<OnboardingStepField> {
  id: OnboardingStepId
}

export const IDENTITY_STEP = {
  id: 'identity',
  label: 'Identity',
  fields: ['first_name', 'email', 'username'],
} satisfies OnboardingStepDescriptor

export const ACCOUNT_STEP = {
  id: 'account',
  label: 'Account',
  fields: ['account_type', 'company_name', 'country', 'state'],
} satisfies OnboardingStepDescriptor

export const CONTACT_STEP = {
  id: 'contact',
  label: 'Contact',
  fields: ['preferred_contact', 'phone_number', 'newsletter_opt_in'],
} satisfies OnboardingStepDescriptor

export function getStepSummary(stepId: OnboardingStepId) {
  if (stepId === 'identity') return '1 of 3'
  if (stepId === 'account') return '2 of 3'
  return '3 of 3'
}
