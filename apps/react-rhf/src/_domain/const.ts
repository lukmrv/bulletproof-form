import { OnboardingDefaultDataContext } from './types'

export const MOCK_BOOTSTRAP_CONTEXT: Partial<OnboardingDefaultDataContext> = {
  profile: {
    first_name: 'Luke',
    email: 'luke@example.com',
    username: 'luke-form',
    account_type: 'company',
    company_name: 'Acme Labs',
    preferred_contact: 'sms',
    phone_number: '12065550199',
    newsletter_opt_in: true,
  },
  geo: {
    country: 'US',
    state: 'CA',
  },
  settings: {
    phoneWithPrefix: true,
  },
}
