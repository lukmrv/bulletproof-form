import { AccountTypeField } from '../field-contracts/account-type'
import { CompanyNameField } from '../field-contracts/company-name'
import { CountryField } from '../field-contracts/country'
import { EmailField } from '../field-contracts/email'
import { FirstNameField } from '../field-contracts/first-name'
import { NewsletterField } from '../field-contracts/newsletter'
import { PhoneNumberField } from '../field-contracts/phone-number'
import { PreferredContactField } from '../field-contracts/preferred-contact'
import { StateField } from '../field-contracts/state'
import { UsernameField } from '../field-contracts/username'
import { DEFAULT_PROFILE, type Profile } from '../default-context'
import { buildConditionalFieldPolicy, FIELD_POLICIES } from '../policies'
import type { SimpleOnboardingFormValues } from '../types'

export function payloadFactory(
  values: SimpleOnboardingFormValues,
  profile: Profile = DEFAULT_PROFILE,
) {
  const account_type = AccountTypeField.normalizeValue(values.account_type)
  const country = CountryField.normalizeValue(values.country)
  const preferred_contact = PreferredContactField.normalizeValue(
    values.preferred_contact,
  )
  const companyNamePolicy = buildConditionalFieldPolicy(
    FIELD_POLICIES.company_name,
    {
      account_type,
      profile,
    },
  )

  const statePolicy = buildConditionalFieldPolicy(FIELD_POLICIES.state, {
    country,
    profile,
  })

  const phoneNumberPolicy = buildConditionalFieldPolicy(
    FIELD_POLICIES.phone_number,
    {
      preferred_contact,
      country,
      profile,
    },
  )

  const payload: {
    first_name: string
    email: string
    username: string
    account_type: SimpleOnboardingFormValues['account_type']
    country: string
    preferred_contact: SimpleOnboardingFormValues['preferred_contact']
    newsletter_opt_in: boolean
    company_name?: string
    state?: string
    phone_number?: string
  } = {
    first_name: FirstNameField.normalizeValue(values.first_name),
    email: EmailField.normalizeValue(values.email),
    username: UsernameField.normalizeValue(values.username),
    account_type,
    country,
    preferred_contact,
    newsletter_opt_in: NewsletterField.normalizeValue(values.newsletter_opt_in),
  }

  const company_name = CompanyNameField.normalizeValue(values.company_name)
  if (companyNamePolicy.includeInPayload && company_name) {
    payload.company_name = company_name
  }

  const state = StateField.normalizeValue(values.state)
  if (statePolicy.includeInPayload && state) {
    payload.state = state
  }

  const phone_number = PhoneNumberField.normalizeValue(values.phone_number)
  if (phoneNumberPolicy.includeInPayload && phone_number) {
    payload.phone_number = phone_number
  }

  return payload
}

export type SimpleOnboardingPayload = ReturnType<typeof payloadFactory>
