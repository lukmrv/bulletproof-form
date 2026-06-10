import type { SimpleOnboardingSubmitRequest, SimpleOnboardingSubmitResponse } from '../types'

interface OnboardingApiClientConfig {
  baseUrl: string
  clientName: string
  latencyMs?: number
}

export class OnboardingApiClient {
  readonly #baseUrl: string
  readonly #clientName: string
  readonly #latencyMs: number

  constructor({
    baseUrl,
    clientName,
    latencyMs = 350,
  }: OnboardingApiClientConfig) {
    this.#baseUrl = baseUrl
    this.#clientName = clientName
    this.#latencyMs = latencyMs
  }

  async saveOnboarding(
    request: SimpleOnboardingSubmitRequest,
  ): Promise<SimpleOnboardingSubmitResponse> {
    await wait(this.#latencyMs)

    console.log('mock api request', {
      url: `${this.#baseUrl}/onboarding`,
      clientName: this.#clientName,
      request,
    })

    if (request.payload.username === 'taken') {
      return {
        ok: false,
        fieldErrors: {
          username: 'Username is already taken',
        },
      }
    }

    return {
      ok: true,
      message: 'Payload accepted',
    }
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
