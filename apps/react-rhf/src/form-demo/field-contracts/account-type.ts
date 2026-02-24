import { z } from 'zod'
import type { AccountType, OnboardingDefaultDataContext } from '../../_domain/types'
import type { StaticValidationFieldContract } from './shared/contract'

const ACCOUNT_TYPE_VALUES = ['individual', 'company'] as const

export const ACCOUNT_TYPE_OPTIONS: Array<{ value: AccountType; label: string }> = [
  { value: 'individual', label: 'individual' },
  { value: 'company', label: 'company' },
]

function isAccountType(value: unknown): value is AccountType {
  return value === 'individual' || value === 'company'
}

export const AccountTypeField = {
  validationSchema: z.enum(ACCOUNT_TYPE_VALUES),
  normalizeValue(value: unknown): AccountType {
    if (isAccountType(value)) return value
    return 'individual'
  },
  defaultDataFactory({ profile }: Pick<OnboardingDefaultDataContext, 'profile'>): AccountType {
    return AccountTypeField.normalizeValue(profile.account_type)
  },
} satisfies StaticValidationFieldContract<
  AccountType,
  Pick<OnboardingDefaultDataContext, 'profile'>
>
