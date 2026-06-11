import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import { DEFAULT_SETTINGS } from '../default-context'
import type { FieldContractBase } from './shared/contract'
import { isString } from './shared/guards'

const PHONE_WITH_PREFIX_REGEX = /^\+\d{8,15}$/
const PHONE_WITHOUT_PREFIX_REGEX = /^\d{8,15}$/

/*
  Required-ness is intrinsic to the contract: when this field participates in
  the form (policy.visible), an empty value is rejected. Whether it participates
  at all is the policy's concern, not the contract's.
*/
export const PhoneNumberField = {
  name: 'phone_number',
  validationSchemaFactory({
    settings = DEFAULT_SETTINGS,
  }: Pick<OnboardingDefaultDataContext, 'settings'> = {}) {
    const phoneWithPrefix = settings.phoneWithPrefix ?? DEFAULT_SETTINGS.phoneWithPrefix
    const regex = phoneWithPrefix ? PHONE_WITH_PREFIX_REGEX : PHONE_WITHOUT_PREFIX_REGEX
    const message = phoneWithPrefix
      ? 'Phone number must use E.164 format'
      : 'Phone number must contain 8-15 digits'

    return z
      .string()
      .trim()
      .min(1, 'Phone number is required')
      // empty is already rejected by min(1); guard so it raises a single issue
      .refine((value) => value === '' || regex.test(value), { message })
  },
  normalizeValue(value: unknown): string {
    return isString(value) ? value.trim() : ''
  },
  defaultDataFactory({
    profile,
    settings = DEFAULT_SETTINGS,
  }: Pick<OnboardingDefaultDataContext, 'profile' | 'settings'>): string {
    const phoneNumber = PhoneNumberField.normalizeValue(profile.phone_number)
    const phoneWithPrefix = settings.phoneWithPrefix ?? DEFAULT_SETTINGS.phoneWithPrefix

    if (phoneWithPrefix && PHONE_WITHOUT_PREFIX_REGEX.test(phoneNumber)) {
      return `+${phoneNumber}`
    }

    if (!phoneWithPrefix && PHONE_WITH_PREFIX_REGEX.test(phoneNumber)) {
      return phoneNumber.slice(1)
    }

    return phoneNumber
  },
  presentationFactory: () => ({
    label: 'Phone number',
    helperText: 'Use E.164, example +12065550199',
  }),
} satisfies FieldContractBase<
  'phone_number',
  string,
  Pick<OnboardingDefaultDataContext, 'profile' | 'settings'>,
  Pick<OnboardingDefaultDataContext, 'settings'>
>
