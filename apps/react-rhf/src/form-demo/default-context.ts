import type { OnboardingProfileData, OnboardingValidationSettings } from '../_domain/types'

export type Profile = Pick<OnboardingProfileData, 'company_name'>

export const DEFAULT_PROFILE: Profile = {}

export const DEFAULT_SETTINGS: OnboardingValidationSettings = {
  phoneWithPrefix: true,
}
