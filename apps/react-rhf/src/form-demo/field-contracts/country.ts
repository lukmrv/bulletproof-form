import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { StaticValidationFieldContract } from './shared/contract'
import { isString } from './shared/guards'

export const COUNTRY_OPTIONS = [
  { value: 'US', label: 'US' },
  { value: 'DE', label: 'DE' },
  { value: 'PL', label: 'PL' },
] as const

function isCountryCode(value: unknown): value is (typeof COUNTRY_OPTIONS)[number]['value'] {
  return COUNTRY_OPTIONS.some((option) => option.value === value)
}

export const CountryField = {
  validationSchema: z.string().trim().refine(isCountryCode, {
    message: 'Country is invalid',
  }),
  normalizeValue(value: unknown): string {
    return isString(value) ? value.trim().toUpperCase() : ''
  },
  defaultDataFactory({ geo }: Pick<OnboardingDefaultDataContext, 'geo'>): string {
    const country = CountryField.normalizeValue(geo.country)
    return isCountryCode(country) ? country : 'US'
  },
} satisfies StaticValidationFieldContract<
  string,
  Pick<OnboardingDefaultDataContext, 'geo'>
>
