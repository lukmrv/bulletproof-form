import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { StaticValidationFieldContract } from './shared/contract'
import { isString } from './shared/guards'

export const StateField = {
  validationSchema: z.string(),
  normalizeValue(value: unknown): string {
    return isString(value) ? value.trim() : ''
  },
  defaultDataFactory({ geo }: Pick<OnboardingDefaultDataContext, 'geo'>): string {
    return StateField.normalizeValue(geo.state)
  },
} satisfies StaticValidationFieldContract<
  string,
  Pick<OnboardingDefaultDataContext, 'geo'>
>
