import { describe, expect, it } from 'vitest'
import { submitErrorFactory } from './submit-error-factory'

describe('submitErrorFactory', () => {
  it('returns empty form errors for successful submit responses', () => {
    expect(
      submitErrorFactory({
        ok: true,
        message: 'Saved',
      }),
    ).toEqual({
      fieldErrors: {},
      formError: null,
    })
  })

  it('maps submit error keys to form field names', () => {
    expect(
      submitErrorFactory({
        ok: false,
        fieldErrors: {
          username: 'Username is already taken',
          company_name: 'Company name is invalid',
          email_address: 'Email is already used',
          country_code: 'Country is unsupported',
          state_code: 'State is unsupported',
          preferred_contact_method: 'Preferred contact is unavailable',
        },
      }),
    ).toEqual({
      fieldErrors: {
        username: 'Username is already taken',
        company_name: 'Company name is invalid',
        email: 'Email is already used',
        country: 'Country is unsupported',
        state: 'State is unsupported',
        preferred_contact: 'Preferred contact is unavailable',
      },
      formError: null,
    })
  })

  it('preserves form-level submit errors', () => {
    expect(
      submitErrorFactory({
        ok: false,
        formError: 'Could not save form',
      }),
    ).toEqual({
      fieldErrors: {},
      formError: 'Could not save form',
    })
  })
})
