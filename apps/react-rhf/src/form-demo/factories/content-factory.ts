import type { ZodType } from 'zod'
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
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import { DEFAULT_SETTINGS } from '../default-context'
import type { SimpleOnboardingFormValues } from '../types'

/*
  contentFactory aggregates each contract's presentationFactory into one typed
  record keyed by field name. It re-creates no copy — the definitions live on the
  contracts. The form renderer calls this once (memoized) and hands the resolved
  strings to dumb inputs as props.
*/

export interface ResolvedFieldContent extends FieldContent {
  // The required indicator is a visual affordance, not an independently declared
  // rule. It is derived from the field's validation schema so it cannot drift:
  // change the schema and the asterisk follows. We probe with the field's own
  // empty representation (normalizeValue(undefined)) rather than a hardcoded ''
  // so the derivation is correct for every value type — string, boolean, enum.
  required: boolean
}

interface PresentableField {
  normalizeValue: (value: unknown) => unknown
  presentationFactory: () => FieldContent
}

function resolveFieldContent(
  field: PresentableField,
  validationSchema: ZodType,
): ResolvedFieldContent {
  return {
    ...field.presentationFactory(),
    required: !validationSchema.safeParse(field.normalizeValue(undefined)).success,
  }
}

export function contentFactory({
  settings = DEFAULT_SETTINGS,
}: Partial<Pick<OnboardingDefaultDataContext, 'profile' | 'settings'>> = {}): Record<
  keyof SimpleOnboardingFormValues,
  ResolvedFieldContent
> {
  return {
    first_name: resolveFieldContent(FirstNameField, FirstNameField.validationSchema),
    email: resolveFieldContent(EmailField, EmailField.validationSchema),
    username: resolveFieldContent(UsernameField, UsernameField.validationSchema),
    account_type: resolveFieldContent(AccountTypeField, AccountTypeField.validationSchema),
    company_name: resolveFieldContent(CompanyNameField, CompanyNameField.validationSchema),
    country: resolveFieldContent(CountryField, CountryField.validationSchema),
    state: resolveFieldContent(StateField, StateField.validationSchema),
    preferred_contact: resolveFieldContent(
      PreferredContactField,
      PreferredContactField.validationSchema,
    ),
    phone_number: resolveFieldContent(
      PhoneNumberField,
      PhoneNumberField.validationSchemaFactory({ settings }),
    ),
    newsletter_opt_in: resolveFieldContent(NewsletterField, NewsletterField.validationSchema),
  }
}
