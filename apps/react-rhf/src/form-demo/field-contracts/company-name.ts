import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { FieldContractBase } from './shared/contract'
import { isString } from './shared/guards'

/*
  Required-ness is intrinsic to the contract: when this field participates in
  the form (policy.visible), an empty value is rejected. Whether it participates
  at all is the policy's concern, not the contract's.
*/
export const CompanyNameField = {
  name: 'company_name',
  validationSchemaFactory: () => z.string().trim().min(1, 'Company name is required'),
  normalizeValue(value: unknown): string {
    return isString(value) ? value.trim() : ''
  },
  defaultDataFactory({ profile }: Pick<OnboardingDefaultDataContext, 'profile'>): string {
    return CompanyNameField.normalizeValue(profile.company_name)
  },
  presentationFactory: () => ({ label: 'Company name' }),
} satisfies FieldContractBase<
  'company_name',
  string,
  Pick<OnboardingDefaultDataContext, 'profile'>
>
