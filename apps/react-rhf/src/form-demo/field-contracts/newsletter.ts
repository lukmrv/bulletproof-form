import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import type { StaticValidationFieldContract } from './shared/contract'
import { isBoolean } from './shared/guards'

export const NewsletterField = {
  name: 'newsletter_opt_in',
  validationSchema: z.boolean(),
  normalizeValue(value: unknown): boolean {
    return isBoolean(value) ? value : false
  },
  defaultDataFactory({ profile }: Pick<OnboardingDefaultDataContext, 'profile'>): boolean {
    return NewsletterField.normalizeValue(profile.newsletter_opt_in)
  },
  presentationFactory: () => ({ label: 'Receive newsletter' }),
} satisfies StaticValidationFieldContract<
  'newsletter_opt_in',
  boolean,
  Pick<OnboardingDefaultDataContext, 'profile'>
>
