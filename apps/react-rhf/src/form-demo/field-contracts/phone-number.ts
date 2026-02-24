import { z } from 'zod'
import type { OnboardingDefaultDataContext } from '../../_domain/types'
import { DEFAULT_SETTINGS } from '../default-context'
import type { ValidationFactoryFieldContract } from './shared/contract'
import { isString } from './shared/guards'

const PHONE_WITH_PREFIX_REGEX = /^\+\d{8,15}$/
const PHONE_WITHOUT_PREFIX_REGEX = /^\d{8,15}$/

export const PhoneNumberField = {
  validationSchemaFactory({
    settings = DEFAULT_SETTINGS,
  }: Pick<OnboardingDefaultDataContext, 'settings'> = {}) {
    const phoneWithPrefix = settings.phoneWithPrefix ?? DEFAULT_SETTINGS.phoneWithPrefix
    const regex = phoneWithPrefix ? PHONE_WITH_PREFIX_REGEX : PHONE_WITHOUT_PREFIX_REGEX
    const message = phoneWithPrefix
      ? 'Phone number must use E.164 format'
      : 'Phone number must contain 8-15 digits'

    return z.string().trim().refine((value) => !value || regex.test(value), {
      message,
    })
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
} satisfies ValidationFactoryFieldContract<
  string,
  Pick<OnboardingDefaultDataContext, 'profile' | 'settings'>,
  Pick<OnboardingDefaultDataContext, 'settings'>
>
