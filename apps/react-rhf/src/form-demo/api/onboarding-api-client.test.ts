import { describe, expect, it, vi } from 'vitest'
import { OnboardingApiClient } from './onboarding-api-client'
import type { SimpleOnboardingSubmitRequest } from '../types'

const validRequest: SimpleOnboardingSubmitRequest = {
  headers: {
    'content-type': 'application/json',
    'x-form-demo': 'react-rhf',
  },
  payload: {
    first_name: 'Luke',
    email: 'luke@example.com',
    username: 'luke-form',
    account_type: 'individual',
    country: 'PL',
    preferred_contact: 'email',
    newsletter_opt_in: true,
  },
}

describe('OnboardingApiClient', () => {
  it('returns a successful mocked save response', async () => {
    const apiClient = new OnboardingApiClient({
      baseUrl: '/mock-api',
      clientName: 'test',
      latencyMs: 0,
    })

    await expect(apiClient.saveOnboarding(validRequest)).resolves.toEqual({
      ok: true,
      message: 'Payload accepted',
    })
  })

  it('returns a field error for the mocked taken username case', async () => {
    const apiClient = new OnboardingApiClient({
      baseUrl: '/mock-api',
      clientName: 'test',
      latencyMs: 0,
    })

    await expect(
      apiClient.saveOnboarding({
        ...validRequest,
        payload: {
          ...validRequest.payload,
          username: 'taken',
        },
      }),
    ).resolves.toEqual({
      ok: false,
      fieldErrors: {
        username: 'Username is already taken',
      },
    })
  })

  it('logs the mocked request target and client name', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    const apiClient = new OnboardingApiClient({
      baseUrl: '/mock-api',
      clientName: 'test-client',
      latencyMs: 0,
    })

    await apiClient.saveOnboarding(validRequest)

    expect(consoleLog).toHaveBeenCalledWith('mock api request', {
      url: '/mock-api/onboarding',
      clientName: 'test-client',
      request: validRequest,
    })

    consoleLog.mockRestore()
  })
})
