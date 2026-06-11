import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { StaticValidationFieldContract } from './shared/contract'
import { isString } from './shared/guards'

const USERNAME_REGEX = /^[a-z0-9-]{3,20}$/

export const UsernameField = {
  validationSchema: z
    .string()
    .trim()
    .min(1, 'Username is required')
    .regex(USERNAME_REGEX, 'Username must be 3-20 chars: lowercase, numbers, -'),
  normalizeValue(value: unknown): string {
    return isString(value) ? value.trim() : ''
  },
  defaultDataFactory({ profile }: Pick<OnboardingDefaultDataContext, 'profile'>): string {
    return UsernameField.normalizeValue(profile.username)
  },
  presentationFactory: () => ({
    label: 'Username',
    helperText: '3-20 chars, lowercase letters, numbers, hyphen',
  }),
} satisfies StaticValidationFieldContract<
  string,
  Pick<OnboardingDefaultDataContext, 'profile'>
>
