import { describe, expect, it, vi } from 'vitest'
import { applySubmitErrors } from './apply-submit-response'

describe('applySubmitErrors', () => {
  it('maps field errors to RHF server errors', () => {
    const setError = vi.fn()
    const setSubmitError = vi.fn()

    applySubmitErrors(
      {
        fieldErrors: {
          username: 'Username is already taken',
        },
        formError: null,
      },
      { setError, setSubmitError },
    )

    expect(setError).toHaveBeenCalledWith('username', {
      type: 'server',
      message: 'Username is already taken',
    })
    expect(setSubmitError).toHaveBeenCalledWith(null)
  })

  it('maps form errors to submit error state', () => {
    const setError = vi.fn()
    const setSubmitError = vi.fn()

    applySubmitErrors(
      {
        fieldErrors: {},
        formError: 'Could not save form',
      },
      { setError, setSubmitError },
    )

    expect(setError).not.toHaveBeenCalled()
    expect(setSubmitError).toHaveBeenCalledWith('Could not save form')
  })

  it('clears submit error state on success', () => {
    const setError = vi.fn()
    const setSubmitError = vi.fn()

    applySubmitErrors(
      {
        fieldErrors: {},
        formError: null,
      },
      { setError, setSubmitError },
    )

    expect(setError).not.toHaveBeenCalled()
    expect(setSubmitError).toHaveBeenCalledWith(null)
  })
})
