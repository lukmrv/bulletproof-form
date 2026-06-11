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
  const account_type = AccountTypeField.normalizeValue(values[AccountTypeField.name])
  const country = CountryField.normalizeValue(values[CountryField.name])
  const preferred_contact = PreferredContactField.normalizeValue(
    values[PreferredContactField.name],
  )

  const companyNamePolicy = buildConditionalFieldPolicy(
    FIELD_POLICIES[CompanyNameField.name],
    {
      account_type,
      profile,
    },
  )

  const statePolicy = buildConditionalFieldPolicy(FIELD_POLICIES[StateField.name], {
    country,
    profile,
  })

  const phoneNumberPolicy = buildConditionalFieldPolicy(
    FIELD_POLICIES[PhoneNumberField.name],
    {
      preferred_contact,
      country,
      profile,
    },
  )

  // The `satisfies` constraint keeps this factory exhaustive against the
  // canonical field key set: add a field to SimpleOnboardingFormValues and
  // this object fails to compile until the field is mapped here.
  return {
    [FirstNameField.name]: FirstNameField.normalizeValue(values[FirstNameField.name]),
    [EmailField.name]: EmailField.normalizeValue(values[EmailField.name]),
    [UsernameField.name]: UsernameField.normalizeValue(values[UsernameField.name]),
    [AccountTypeField.name]: account_type,
    [CountryField.name]: country,
    [PreferredContactField.name]: preferred_contact,
    [NewsletterField.name]: NewsletterField.normalizeValue(
      values[NewsletterField.name],
    ),
    // Conditional fields — included only when the policy's payloadCondition is met.
    ...(companyNamePolicy.includeInPayload && {
      [CompanyNameField.name]: CompanyNameField.normalizeValue(
        values[CompanyNameField.name],
      ),
    }),
    ...(statePolicy.includeInPayload && {
      [StateField.name]: StateField.normalizeValue(values[StateField.name]),
    }),
    ...(phoneNumberPolicy.includeInPayload && {
      [PhoneNumberField.name]: PhoneNumberField.normalizeValue(
        values[PhoneNumberField.name],
      ),
    }),
  } satisfies SimpleOnboardingFormValues
}

export type SimpleOnboardingPayload = ReturnType<typeof payloadFactory>
