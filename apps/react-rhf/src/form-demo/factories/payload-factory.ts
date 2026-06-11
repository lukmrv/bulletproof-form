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
import { DEFAULT_PROFILE } from '../default-context'
import { evaluatePolicy, FIELD_POLICIES, type PolicyContext } from '../policies'
import type { SimpleOnboardingApiRequest, SimpleOnboardingFormValues } from '../types'

/*
  The payload factory is the single place where form state becomes the request
  shape. It is the deliberate exception to keyof FormValues exhaustiveness: its
  keys follow the API's naming, not the form's. Correctness is enforced by the
  `satisfies` check against the backend-provided request type — a wrong key, a
  wrong type, or a missing required field is a compile error.
*/
export function payloadFactory(
  values: SimpleOnboardingFormValues,
  context: PolicyContext = { profile: DEFAULT_PROFILE },
) {
  const companyNamePolicy = evaluatePolicy(
    FIELD_POLICIES[CompanyNameField.name],
    values,
    context,
  )
  const statePolicy = evaluatePolicy(FIELD_POLICIES[StateField.name], values, context)
  const phoneNumberPolicy = evaluatePolicy(
    FIELD_POLICIES[PhoneNumberField.name],
    values,
    context,
  )

  return {
    [FirstNameField.name]: FirstNameField.normalizeValue(values[FirstNameField.name]),
    email_address: EmailField.normalizeValue(values[EmailField.name]),
    [UsernameField.name]: UsernameField.normalizeValue(values[UsernameField.name]),
    [AccountTypeField.name]: AccountTypeField.normalizeValue(values[AccountTypeField.name]),
    country_code: CountryField.normalizeValue(values[CountryField.name]),
    preferred_contact_method: PreferredContactField.normalizeValue(
      values[PreferredContactField.name],
    ),
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
      state_code: StateField.normalizeValue(values[StateField.name]),
    }),
    ...(phoneNumberPolicy.includeInPayload && {
      [PhoneNumberField.name]: PhoneNumberField.normalizeValue(
        values[PhoneNumberField.name],
      ),
    }),
  } satisfies SimpleOnboardingApiRequest
}

// Derived view for consumers; correctness flows from the API contract above.
export type SimpleOnboardingPayload = ReturnType<typeof payloadFactory>
