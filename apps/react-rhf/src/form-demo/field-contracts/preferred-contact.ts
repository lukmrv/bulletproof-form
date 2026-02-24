import { z } from 'zod'
import type { OnboardingDefaultDataContext, PreferredContact } from '../../_domain/types'
import type { StaticValidationFieldContract } from './shared/contract'

const PREFERRED_CONTACT_VALUES = ['email', 'sms'] as const

export const PREFERRED_CONTACT_OPTIONS: Array<{
  value: PreferredContact
  label: string
}> = [
  { value: 'email', label: 'email' },
  { value: 'sms', label: 'sms' },
]

function isPreferredContact(value: unknown): value is PreferredContact {
  return value === 'email' || value === 'sms'
}

export const PreferredContactField = {
  validationSchema: z.enum(PREFERRED_CONTACT_VALUES),
  normalizeValue(value: unknown): PreferredContact {
    if (isPreferredContact(value)) return value
    return 'email'
  },
  defaultDataFactory({
    profile,
  }: Pick<OnboardingDefaultDataContext, 'profile'>): PreferredContact {
    return PreferredContactField.normalizeValue(profile.preferred_contact)
  },
} satisfies StaticValidationFieldContract<
  PreferredContact,
  Pick<OnboardingDefaultDataContext, 'profile'>
>
