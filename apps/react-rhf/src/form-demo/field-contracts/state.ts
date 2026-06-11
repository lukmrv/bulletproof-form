import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { FieldContractBase } from './shared/contract'
import { isString } from './shared/guards'

/*
  Required-ness is intrinsic to the contract: when this field participates in
  the form (policy.visible), an empty value is rejected. Whether it participates
  at all is the policy's concern, not the contract's.
*/
export const StateField = {
  name: 'state',
  validationSchemaFactory: () => z.string().trim().min(1, 'State is required'),
  normalizeValue(value: unknown): string {
    return isString(value) ? value.trim() : ''
  },
  defaultDataFactory({ geo }: Pick<OnboardingDefaultDataContext, 'geo'>): string {
    return StateField.normalizeValue(geo.state)
  },
  presentationFactory: () => ({ label: 'State' }),
} satisfies FieldContractBase<
  'state',
  string,
  Pick<OnboardingDefaultDataContext, 'geo'>
>
