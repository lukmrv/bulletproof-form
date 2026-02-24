import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { StaticValidationFieldContract } from './shared/contract'
import { isString } from './shared/guards'

export const FirstNameField = {
  validationSchema: z.string().trim().min(1, 'First name is required'),
  normalizeValue(value: unknown): string {
    return isString(value) ? value.trim() : ''
  },
  defaultDataFactory({ profile }: Pick<OnboardingDefaultDataContext, 'profile'>): string {
    return FirstNameField.normalizeValue(profile.first_name)
  },
} satisfies StaticValidationFieldContract<
  string,
  Pick<OnboardingDefaultDataContext, 'profile'>
>
