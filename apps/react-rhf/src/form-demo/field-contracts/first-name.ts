import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { StaticValidationFieldContract } from './shared/contract'
import { isString } from './shared/guards'

export const FirstNameField = {
  name: 'first_name',
  validationSchema: z.string().trim().min(1, 'First name is required'),
  normalizeValue(value: unknown): string {
    return isString(value) ? value.trim() : ''
  },
  defaultDataFactory({ profile }: Pick<OnboardingDefaultDataContext, 'profile'>): string {
    return FirstNameField.normalizeValue(profile.first_name)
  },
  presentationFactory: () => ({ label: 'First name' }),
} satisfies StaticValidationFieldContract<
  'first_name',
  string,
  Pick<OnboardingDefaultDataContext, 'profile'>
>
