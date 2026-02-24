import type { SimpleOnboardingPayload } from './factories/payload-factory'
import type { AccountType, PreferredContact } from '../_domain/types'

export interface SimpleOnboardingFormValues {
  first_name: string
  email: string
  username: string
  account_type: AccountType
  company_name?: string
  country: string
  state?: string
  preferred_contact: PreferredContact
  phone_number?: string
  newsletter_opt_in: boolean
}

export interface SimpleOnboardingSubmitResult {
  message: string
  payload: SimpleOnboardingPayload
}
