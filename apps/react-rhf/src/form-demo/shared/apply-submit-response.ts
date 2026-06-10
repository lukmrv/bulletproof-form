import type { FieldPath, UseFormSetError } from 'react-hook-form'
import type { SimpleOnboardingFormValues, SimpleOnboardingSubmitErrors } from '../types'

interface ApplySubmitResponseOptions {
  setError: UseFormSetError<SimpleOnboardingFormValues>
  setSubmitError: (message: string | null) => void
}

export function applySubmitErrors(
  submitErrors: SimpleOnboardingSubmitErrors,
  { setError, setSubmitError }: ApplySubmitResponseOptions,
) {
  if (Object.keys(submitErrors.fieldErrors).length === 0 && !submitErrors.formError) {
    setSubmitError(null)
    return
  }

  Object.entries(submitErrors.fieldErrors).forEach(([fieldName, message]) => {
    if (!message) return

    setError(fieldName as FieldPath<SimpleOnboardingFormValues>, {
      type: 'server',
      message,
    })
  })

  setSubmitError(submitErrors.formError)
}
