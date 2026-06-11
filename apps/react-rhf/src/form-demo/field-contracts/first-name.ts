import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { FieldContractBase } from './shared/contract'
import { isString } from './shared/guards'

export const FirstNameField = {
  name: 'first_name',
  validationSchemaFactory: () => z.string().trim().min(1, 'First name is required'),
  normalizeValue(value: unknown): string {
    return isString(value) ? value.trim() : ''
  },
  defaultDataFactory({ profile }: Pick<OnboardingDefaultDataContext, 'profile'>): string {
    return FirstNameField.normalizeValue(profile.first_name)
  },
  presentationFactory: () => ({ label: 'First name' }),
} satisfies FieldContractBase<
  'first_name',
  string,
  Pick<OnboardingDefaultDataContext, 'profile'>
>
