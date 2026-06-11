import { describe, expect, it } from 'vitest'
import { MOCK_BOOTSTRAP_CONTEXT } from '../../_domain/const'
import { DEFAULT_PROFILE, DEFAULT_SETTINGS } from '../default-context'
import { buildConditionalFieldPolicy, FIELD_POLICIES } from '../policies'
import type { SimpleOnboardingFormValues } from '../types'
import { defaultValuesFactory } from './default-values-factory'
import { payloadFactory } from './payload-factory'
import { validationFactory } from './validation-factory'

const validCompanyValues: SimpleOnboardingFormValues = {
  first_name: 'Luke',
  email: 'luke@example.com',
  username: 'luke-form',
  account_type: 'company',
  company_name: 'Acme Labs',
  country: 'US',
  state: 'CA',
  preferred_contact: 'sms',
  phone_number: '+12065550199',
  newsletter_opt_in: true,
}

describe('form factories', () => {
  it('hydrates defaults through the shared default values factory', () => {
    expect(defaultValuesFactory(MOCK_BOOTSTRAP_CONTEXT)).toEqual(validCompanyValues)
  })

  it('runs conditional field contract schemas when policies make them visible', () => {
    const schema = validationFactory({
      profile: DEFAULT_PROFILE,
      settings: DEFAULT_SETTINGS,
    })

    const result = schema.safeParse({
      ...validCompanyValues,
      company_name: '',
      state: '',
      phone_number: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual([
        'company_name',
        'state',
        'phone_number',
      ])
    }
  })

  it('includes conditional payload fields only when policies allow them', () => {
    expect(payloadFactory(validCompanyValues)).toEqual({
      first_name: 'Luke',
      email: 'luke@example.com',
      username: 'luke-form',
      account_type: 'company',
      company_name: 'Acme Labs',
      country: 'US',
      state: 'CA',
      preferred_contact: 'sms',
      phone_number: '+12065550199',
      newsletter_opt_in: true,
    })

    expect(
      payloadFactory({
        ...validCompanyValues,
        account_type: 'individual',
        country: 'PL',
        preferred_contact: 'email',
      }),
    ).toEqual({
      first_name: 'Luke',
      email: 'luke@example.com',
      username: 'luke-form',
      account_type: 'individual',
      country: 'PL',
      preferred_contact: 'email',
      newsletter_opt_in: true,
    })
  })

  it('keeps policy visibility and payload participation aligned', () => {
    expect(
      buildConditionalFieldPolicy(FIELD_POLICIES.phone_number, {
        preferred_contact: 'sms',
        country: 'US',
        profile: DEFAULT_PROFILE,
      }),
    ).toEqual({
      visible: true,
      includeInPayload: true,
    })
  })
})
