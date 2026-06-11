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

/*
  Backend-provided request shape (hand-declared stand-in for a spec-generated
  type). Its keys follow the API's naming, not the form's — the payload factory
  is checked against it with `satisfies`, so payload correctness is enforced by
  the API contract, not maintained by hand.
*/
export interface SimpleOnboardingApiRequest {
  first_name: string
  email_address: string
  username: string
  account_type: AccountType
  country_code: string
  preferred_contact_method: PreferredContact
  newsletter_opt_in: boolean
  company_name?: string
  state_code?: string
  phone_number?: string
}

export interface SimpleOnboardingSubmitRequest {
  headers: Record<string, string>
  payload: SimpleOnboardingApiRequest
}

export type SimpleOnboardingSubmitErrorKey = keyof SimpleOnboardingApiRequest

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
