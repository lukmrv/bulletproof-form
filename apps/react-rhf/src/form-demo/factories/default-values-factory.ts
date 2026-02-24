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
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import { DEFAULT_PROFILE, DEFAULT_SETTINGS } from '../default-context'
import type { SimpleOnboardingFormValues } from '../types'

export function defaultValuesFactory({
  geo = {},
  profile = DEFAULT_PROFILE,
  settings = DEFAULT_SETTINGS,
}: Partial<OnboardingDefaultDataContext> = {}): SimpleOnboardingFormValues {
  const profileContext = { profile }
  const geoContext = { geo }
  const profileWithSettingsContext = { profile, settings }

  return {
    first_name: FirstNameField.defaultDataFactory(profileContext),
    email: EmailField.defaultDataFactory(profileContext),
    username: UsernameField.defaultDataFactory(profileContext),
    account_type: AccountTypeField.defaultDataFactory(profileContext),
    company_name: CompanyNameField.defaultDataFactory(profileContext),
    country: CountryField.defaultDataFactory(geoContext),
    state: StateField.defaultDataFactory(geoContext),
    preferred_contact: PreferredContactField.defaultDataFactory(profileContext),
    phone_number: PhoneNumberField.defaultDataFactory(profileWithSettingsContext),
    newsletter_opt_in: NewsletterField.defaultDataFactory(profileContext),
  }
}
