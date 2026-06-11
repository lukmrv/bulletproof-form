import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { FieldContractBase } from './shared/contract'
import { isBoolean } from './shared/guards'

export const NewsletterField = {
  name: 'newsletter_opt_in',
  validationSchemaFactory: () => z.boolean(),
  normalizeValue(value: unknown): boolean {
    return isBoolean(value) ? value : false
  },
  defaultDataFactory({ profile }: Pick<OnboardingDefaultDataContext, 'profile'>): boolean {
    return NewsletterField.normalizeValue(profile.newsletter_opt_in)
  },
  presentationFactory: () => ({ label: 'Receive newsletter' }),
} satisfies FieldContractBase<
  'newsletter_opt_in',
  boolean,
  Pick<OnboardingDefaultDataContext, 'profile'>
>
