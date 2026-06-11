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
    [FirstNameField.name]: FirstNameField.defaultDataFactory(profileContext),
    [EmailField.name]: EmailField.defaultDataFactory(profileContext),
    [UsernameField.name]: UsernameField.defaultDataFactory(profileContext),
    [AccountTypeField.name]: AccountTypeField.defaultDataFactory(profileContext),
    [CompanyNameField.name]: CompanyNameField.defaultDataFactory(profileContext),
    [CountryField.name]: CountryField.defaultDataFactory(geoContext),
    [StateField.name]: StateField.defaultDataFactory(geoContext),
    [PreferredContactField.name]: PreferredContactField.defaultDataFactory(profileContext),
    [PhoneNumberField.name]: PhoneNumberField.defaultDataFactory(
      profileWithSettingsContext,
    ),
    [NewsletterField.name]: NewsletterField.defaultDataFactory(profileContext),
  }
}
