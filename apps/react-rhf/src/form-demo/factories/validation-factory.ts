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
import { evaluatePolicy, FIELD_POLICIES } from '../policies'
import type { SimpleOnboardingFormValues } from '../types'

export function validationFactory({
  settings = DEFAULT_SETTINGS,
  profile = DEFAULT_PROFILE,
}: Pick<OnboardingDefaultDataContext, 'profile' | 'settings'>) {
  const formContext = { profile }
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
        [FirstNameField.name]: FirstNameField.validationSchemaFactory(),
        [EmailField.name]: EmailField.validationSchemaFactory(),
        [UsernameField.name]: UsernameField.validationSchemaFactory(),
        [AccountTypeField.name]: AccountTypeField.validationSchemaFactory(),
        [CompanyNameField.name]: z.string().optional(),
        [CountryField.name]: CountryField.validationSchemaFactory(),
        [StateField.name]: z.string().optional(),
        [PreferredContactField.name]: PreferredContactField.validationSchemaFactory(),
        [PhoneNumberField.name]: z.string().optional(),
        [NewsletterField.name]: NewsletterField.validationSchemaFactory(),
      } satisfies Record<keyof SimpleOnboardingFormValues, ZodType>,
    )
    // Form-level validation boundary:
    // Conditional fields are gated on policy.visible and run their complete
    // contract schema. Cross-field rules that are not policy-driven would also
    // live here. Field contracts only own intrinsic single-field validation.
    .superRefine((values, ctx) => {
      const companyNamePolicy = evaluatePolicy(
        FIELD_POLICIES[CompanyNameField.name],
        values,
        formContext,
      )

      if (companyNamePolicy.visible) {
        const result = CompanyNameField.validationSchemaFactory().safeParse(
          values[CompanyNameField.name],
        )
        result.error?.issues.forEach((issue) =>
          ctx.addIssue({ ...issue, path: [CompanyNameField.name] })
        )
      }

      const statePolicy = evaluatePolicy(FIELD_POLICIES[StateField.name], values, formContext)

      if (statePolicy.visible) {
        const result = StateField.validationSchemaFactory().safeParse(values[StateField.name])
        result.error?.issues.forEach((issue) => ctx.addIssue({ ...issue, path: [StateField.name] }))
      }

      const phoneNumberPolicy = evaluatePolicy(
        FIELD_POLICIES[PhoneNumberField.name],
        values,
        formContext,
      )

      if (phoneNumberPolicy.visible) {
        const result = phoneValidationSchema.safeParse(values[PhoneNumberField.name])
        result.error?.issues.forEach((issue) =>
          ctx.addIssue({ ...issue, path: [PhoneNumberField.name] })
        )
      }
    })
}
