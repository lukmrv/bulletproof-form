export type AccountType = 'individual' | 'company'
export type PreferredContact = 'email' | 'sms'

export interface OnboardingProfileData {
  first_name?: unknown
  email?: unknown
  username?: unknown
  account_type?: unknown
  company_name?: unknown
  preferred_contact?: unknown
  phone_number?: unknown
  newsletter_opt_in?: unknown
}

export interface OnboardingGeoData {
  country?: unknown
  state?: unknown
}

export interface OnboardingValidationSettings {
  phoneWithPrefix: boolean
}

export interface OnboardingDefaultDataContext {
  profile: OnboardingProfileData
  geo: OnboardingGeoData
  settings?: Partial<OnboardingValidationSettings>
}
