import { describe, expect, it } from 'vitest'
import { contentFactory } from './content-factory'

describe('content factory', () => {
  it('aggregates copy declared on the field contracts', () => {
    const content = contentFactory()

    expect(content.first_name.label).toBe('First name')
    expect(content.username).toMatchObject({
      label: 'Username',
      helperText: '3-20 chars, lowercase letters, numbers, hyphen',
    })
    expect(content.phone_number.helperText).toBe('Use E.164, example +12065550199')
  })

  it('derives the required indicator from each field validation schema', () => {
    const content = contentFactory()

    // Intrinsically required: an empty value is rejected by the contract schema.
    expect(content.first_name.required).toBe(true)
    expect(content.email.required).toBe(true)
    expect(content.username.required).toBe(true)
    expect(content.country.required).toBe(true)

    // Conditional fields are required by their own contract: whether they
    // participate at all is the policy's concern, but when they render the
    // contract schema rejects an empty value.
    expect(content.company_name.required).toBe(true)
    expect(content.state.required).toBe(true)
    expect(content.phone_number.required).toBe(true)

    // Non-string fields must not be mis-derived as required by an '' probe.
    expect(content.newsletter_opt_in.required).toBe(false)
  })
})
