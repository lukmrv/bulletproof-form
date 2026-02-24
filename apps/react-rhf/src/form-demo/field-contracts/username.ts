import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { StaticValidationFieldContract } from './shared/contract'
import { isString } from './shared/guards'

const USERNAME_REGEX = /^[a-z0-9-]{3,20}$/
const USERNAME_SYNC_SCHEMA = z.string().trim().regex(USERNAME_REGEX)

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
} satisfies StaticValidationFieldContract<
  string,
  Pick<OnboardingDefaultDataContext, 'profile'>
>