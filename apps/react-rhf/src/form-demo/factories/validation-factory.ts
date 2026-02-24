import { z } from 'zod'
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
import { buildConditionalFieldPolicy, FIELD_POLICIES } from '../policies'

export function validationFactory({
  settings = DEFAULT_SETTINGS,
  profile = DEFAULT_PROFILE,
}: Pick<OnboardingDefaultDataContext, 'profile' | 'settings'>) {
  const phoneValidationSchema = PhoneNumberField.validationSchemaFactory({
    settings,
  })

  return z
    .object({
      first_name: FirstNameField.validationSchema,
      email: EmailField.validationSchema,
      username: UsernameField.validationSchema,
      account_type: AccountTypeField.validationSchema,
      company_name: CompanyNameField.validationSchema.optional(),
      country: CountryField.validationSchema,
      state: StateField.validationSchema.optional(),
      preferred_contact: PreferredContactField.validationSchema,
      phone_number: phoneValidationSchema.optional(),
      newsletter_opt_in: NewsletterField.validationSchema,
    })
    // Form-level validation boundary:
    // Cross-field and policy-driven requirements live here because they depend on
    // multiple fields and external context (e.g. profile/settings). Field contracts
    // only own intrinsic single-field validation and normalization.
    .superRefine((values, ctx) => {
      const companyNamePolicy = buildConditionalFieldPolicy(
        FIELD_POLICIES.company_name,
        {
          account_type: values.account_type,
          profile,
        },
      )

      const statePolicy = buildConditionalFieldPolicy(FIELD_POLICIES.state, {
        country: values.country,
        profile,
      })

      const phoneNumberPolicy = buildConditionalFieldPolicy(
        FIELD_POLICIES.phone_number,
        {
          preferred_contact: values.preferred_contact,
          country: values.country,
          profile,
        },
      )

      const company_name = CompanyNameField.normalizeValue(values.company_name)

      if (companyNamePolicy.required && !company_name) {
        ctx.addIssue({
          code: 'custom',
          path: ['company_name'],
          message: 'Company name is required for company account',
        })
      }

      const state = StateField.normalizeValue(values.state)
      if (statePolicy.required && !state) {
        ctx.addIssue({
          code: 'custom',
          path: ['state'],
          message: 'State is required when country is US',
        })
      }

      if (phoneNumberPolicy.required) {
        const phone_number = PhoneNumberField.normalizeValue(values.phone_number)

        if (!phone_number) {
          ctx.addIssue({
            code: 'custom',
            path: ['phone_number'],
            message: 'Phone number is required for SMS contact in US',
          })
        }
      }
    })
}
