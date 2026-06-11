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
import type { FieldContent } from '../field-contracts/shared/contract'
import { deriveRequired } from '../field-contracts/shared/guards'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import { DEFAULT_SETTINGS } from '../default-context'
import type { SimpleOnboardingFormValues } from '../types'

/*
  contentFactory aggregates each contract's presentationFactory into one typed
  record keyed by field name. It re-creates no copy — the definitions live on the
  contracts. The form renderer calls this once (memoized) and hands the resolved
  strings to dumb inputs as props.

  The required indicator is derived from each contract's validation schema via
  deriveRequired (shared/guards.ts), never declared independently.
*/

export interface ResolvedFieldContent extends FieldContent {
  required: boolean
}

export function contentFactory({
  settings = DEFAULT_SETTINGS,
}: Partial<Pick<OnboardingDefaultDataContext, 'profile' | 'settings'>> = {}): Record<
  keyof SimpleOnboardingFormValues,
  ResolvedFieldContent
> {
  return {
    [FirstNameField.name]: {
      ...FirstNameField.presentationFactory(),
      required: deriveRequired(FirstNameField),
    },
    [EmailField.name]: {
      ...EmailField.presentationFactory(),
      required: deriveRequired(EmailField),
    },
    [UsernameField.name]: {
      ...UsernameField.presentationFactory(),
      required: deriveRequired(UsernameField),
    },
    [AccountTypeField.name]: {
      ...AccountTypeField.presentationFactory(),
      required: deriveRequired(AccountTypeField),
    },
    [CompanyNameField.name]: {
      ...CompanyNameField.presentationFactory(),
      required: deriveRequired(CompanyNameField),
    },
    [CountryField.name]: {
      ...CountryField.presentationFactory(),
      required: deriveRequired(CountryField),
    },
    [StateField.name]: {
      ...StateField.presentationFactory(),
      required: deriveRequired(StateField),
    },
    [PreferredContactField.name]: {
      ...PreferredContactField.presentationFactory(),
      required: deriveRequired(PreferredContactField),
    },
    [PhoneNumberField.name]: {
      ...PhoneNumberField.presentationFactory(),
      required: deriveRequired(PhoneNumberField, { settings }),
    },
    [NewsletterField.name]: {
      ...NewsletterField.presentationFactory(),
      required: deriveRequired(NewsletterField),
    },
  }
}
