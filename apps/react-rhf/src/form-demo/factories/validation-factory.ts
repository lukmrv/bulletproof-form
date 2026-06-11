import { z, type ZodType } from 'zod'
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
import type { SimpleOnboardingFormValues } from '../types'

export function validationFactory({
  settings = DEFAULT_SETTINGS,
  profile = DEFAULT_PROFILE,
}: Pick<OnboardingDefaultDataContext, 'profile' | 'settings'>) {
  const phoneValidationSchema = PhoneNumberField.validationSchemaFactory({
    settings,
  })

  return z
    .object(
      {
        // Unconditional fields validate their full contract schema here.
        // Conditional fields are permissive in the base object: their complete
        // contract schema runs in superRefine, gated on policy.visible, so a
        // hidden field can never fail validation.
        [FirstNameField.name]: FirstNameField.validationSchema,
        [EmailField.name]: EmailField.validationSchema,
        [UsernameField.name]: UsernameField.validationSchema,
        [AccountTypeField.name]: AccountTypeField.validationSchema,
        [CompanyNameField.name]: z.string().optional(),
        [CountryField.name]: CountryField.validationSchema,
        [StateField.name]: z.string().optional(),
        [PreferredContactField.name]: PreferredContactField.validationSchema,
        [PhoneNumberField.name]: z.string().optional(),
        [NewsletterField.name]: NewsletterField.validationSchema,
      } satisfies Record<keyof SimpleOnboardingFormValues, ZodType>,
    )
    // Form-level validation boundary:
    // Conditional fields are gated on policy.visible and run their complete
    // contract schema. Cross-field rules that are not policy-driven would also
    // live here. Field contracts only own intrinsic single-field validation.
    .superRefine((values, ctx) => {
      const companyNamePolicy = buildConditionalFieldPolicy(
        FIELD_POLICIES[CompanyNameField.name],
        {
          account_type: values.account_type,
          profile,
        },
      )

      if (companyNamePolicy.visible) {
        const result = CompanyNameField.validationSchema.safeParse(
          values[CompanyNameField.name],
        )
        result.error?.issues.forEach((issue) =>
          ctx.addIssue({ ...issue, path: [CompanyNameField.name] })
        )
      }

      const statePolicy = buildConditionalFieldPolicy(FIELD_POLICIES[StateField.name], {
        country: values.country,
        profile,
      })

      if (statePolicy.visible) {
        const result = StateField.validationSchema.safeParse(values[StateField.name])
        result.error?.issues.forEach((issue) => ctx.addIssue({ ...issue, path: [StateField.name] }))
      }

      const phoneNumberPolicy = buildConditionalFieldPolicy(
        FIELD_POLICIES[PhoneNumberField.name],
        {
          preferred_contact: values.preferred_contact,
          country: values.country,
          profile,
        },
      )

      if (phoneNumberPolicy.visible) {
        const result = phoneValidationSchema.safeParse(values[PhoneNumberField.name])
        result.error?.issues.forEach((issue) =>
          ctx.addIssue({ ...issue, path: [PhoneNumberField.name] })
        )
      }
    })
}
