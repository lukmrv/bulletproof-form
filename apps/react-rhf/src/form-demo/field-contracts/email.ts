import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { FieldContractBase } from './shared/contract'
import { isString } from './shared/guards'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const EmailField = {
  name: 'email',
  validationSchemaFactory: () =>
    z
      .string()
      .trim()
      .min(1, 'Email is required')
      .regex(EMAIL_REGEX, 'Email format is invalid'),
  normalizeValue(value: unknown): string {
    return isString(value) ? value.trim() : ''
  },
  defaultDataFactory({ profile }: Pick<OnboardingDefaultDataContext, 'profile'>): string {
    return EmailField.normalizeValue(profile.email)
  },
  presentationFactory: () => ({ label: 'Email' }),
} satisfies FieldContractBase<
  'email',
  string,
  Pick<OnboardingDefaultDataContext, 'profile'>
>
