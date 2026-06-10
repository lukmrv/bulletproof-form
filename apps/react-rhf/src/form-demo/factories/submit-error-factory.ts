import type {
  SimpleOnboardingFormValues,
  SimpleOnboardingSubmitErrorKey,
  SimpleOnboardingSubmitErrors,
  SimpleOnboardingSubmitResponse,
} from '../types'

export function submitErrorFactory(
  response: SimpleOnboardingSubmitResponse,
): SimpleOnboardingSubmitErrors {
  if (response.ok) {
    return {
      fieldErrors: {},
      formError: null,
    }
  }

  return {
    fieldErrors: mapSubmitFieldErrors(response.fieldErrors ?? {}),
    formError: response.formError ?? null,
  }
}

function mapSubmitFieldErrors(
  fieldErrors: Partial<Record<SimpleOnboardingSubmitErrorKey, string>>,
) {
  return Object.entries(fieldErrors).reduce<
    Partial<Record<keyof SimpleOnboardingFormValues, string>>
  >((formFieldErrors, [submitErrorKey, message]) => {
    if (!message) return formFieldErrors

    const fieldName = getSubmitErrorFieldName(submitErrorKey as SimpleOnboardingSubmitErrorKey)
    formFieldErrors[fieldName] = message

    return formFieldErrors
  }, {})
}

function getSubmitErrorFieldName(
  submitErrorKey: SimpleOnboardingSubmitErrorKey,
): keyof SimpleOnboardingFormValues {
  switch (submitErrorKey) {
    case 'first_name':
      return 'first_name'
    case 'email_address':
      return 'email'
    case 'username':
      return 'username'
    case 'account_type':
      return 'account_type'
    case 'company_name':
      return 'company_name'
    case 'country_code':
      return 'country'
    case 'state_code':
      return 'state'
    case 'preferred_contact_method':
      return 'preferred_contact'
    case 'newsletter_opt_in':
      return 'newsletter_opt_in'
    case 'phone_number':
      return 'phone_number'
  }
}
