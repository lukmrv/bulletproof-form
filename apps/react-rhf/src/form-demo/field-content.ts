import type { SimpleOnboardingFormValues } from './types'

/*
  Single source of user-facing field copy for the onboarding form.

  Per the forms architecture, inputs are dumb and reach for nothing: labels,
  helper text, and placeholders are resolved by the form/contract layer and
  passed into the field as props. Centralizing the copy here keeps it out of the
  input components and gives every renderer one home to read from (and one place
  to swap for i18n-resolved strings later).
*/

export interface FieldContent {
  label: string
  helperText?: string
  placeholder?: string
}

export const ONBOARDING_FIELD_CONTENT: Record<keyof SimpleOnboardingFormValues, FieldContent> = {
  first_name: { label: 'First name' },
  email: { label: 'Email' },
  username: {
    label: 'Username',
    helperText: '3-20 chars, lowercase letters, numbers, hyphen',
  },
  account_type: { label: 'Account type' },
  company_name: { label: 'Company name' },
  country: { label: 'Country' },
  state: { label: 'State' },
  preferred_contact: { label: 'Preferred contact' },
  phone_number: {
    label: 'Phone number',
    helperText: 'Use E.164, example +12065550199',
  },
  newsletter_opt_in: { label: 'Receive newsletter' },
}
