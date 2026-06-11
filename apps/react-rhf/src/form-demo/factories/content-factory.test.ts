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

    // Intrinsically optional (required-ness is policy/context-driven, not on the
    // contract): the contract schema accepts the field's empty value.
    expect(content.company_name.required).toBe(false)
    expect(content.state.required).toBe(false)
    expect(content.phone_number.required).toBe(false)

    // Non-string fields must not be mis-derived as required by an '' probe.
    expect(content.newsletter_opt_in.required).toBe(false)
  })
})
