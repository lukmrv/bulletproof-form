import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { StaticValidationFieldContract } from './shared/contract'
import { isString } from './shared/guards'

export const CompanyNameField = {
  validationSchema: z.string(),
  normalizeValue(value: unknown): string {
    return isString(value) ? value.trim() : ''
  },
  defaultDataFactory({ profile }: Pick<OnboardingDefaultDataContext, 'profile'>): string {
    return CompanyNameField.normalizeValue(profile.company_name)
  },
} satisfies StaticValidationFieldContract<
  string,
  Pick<OnboardingDefaultDataContext, 'profile'>
>
