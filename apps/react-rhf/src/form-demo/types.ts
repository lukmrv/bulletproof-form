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

export interface SimpleOnboardingSubmitRequest {
  headers: Record<string, string>
  payload: SimpleOnboardingPayload
}

export type SimpleOnboardingSubmitErrorKey =
  | 'first_name'
  | 'email_address'
  | 'username'
  | 'account_type'
  | 'company_name'
  | 'country_code'
  | 'state_code'
  | 'preferred_contact_method'
  | 'newsletter_opt_in'
  | 'phone_number'

export type SimpleOnboardingSubmitResponse =
  | {
    ok: true
    message?: string
  }
  | {
    ok: false
    fieldErrors?: Partial<Record<SimpleOnboardingSubmitErrorKey, string>>
    formError?: string
  }

export type SimpleOnboardingSubmitMutation = (
  request: SimpleOnboardingSubmitRequest,
) => Promise<SimpleOnboardingSubmitResponse> | SimpleOnboardingSubmitResponse

export interface SimpleOnboardingSubmitErrors {
  fieldErrors: Partial<Record<keyof SimpleOnboardingFormValues, string>>
  formError: string | null
}
