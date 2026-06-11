import { type ComponentType, useEffect, useMemo, useState } from 'react'
import type { OnboardingDefaultDataContext, OnboardingValidationSettings } from '../_domain/types'
import { DEFAULT_PROFILE, DEFAULT_SETTINGS } from './default-context'
import { OnboardingApiClient } from './api/onboarding-api-client'
import { isAbortError, loadBootstrapContext } from './shared/_bootstrap'
import type { SimpleOnboardingSubmitMutation } from './types'

interface OnboardingFormOrchestratorProps {
  renderer: ComponentType<OnboardingFormRenderContract>
}

export interface OnboardingFormRenderContract {
  bootstrapError: string | null
  formContext: ResolvedOnboardingFormContext
  submitMutation: SimpleOnboardingSubmitMutation
}

export interface ResolvedOnboardingFormContext extends OnboardingDefaultDataContext {
  settings: OnboardingValidationSettings
}

export function OnboardingFormOrchestrator({
  renderer: Renderer,
}: OnboardingFormOrchestratorProps) {
  const [formContext, setFormContext] = useState<ResolvedOnboardingFormContext>({
    profile: DEFAULT_PROFILE,
    geo: {},
    settings: DEFAULT_SETTINGS,
  })
  const onboardingApiClient = useMemo(
    () =>
      new OnboardingApiClient({
        baseUrl: '/mock-api',
        clientName: 'react-rhf-demo',
      }),
    [],
  )
  const [isHydrating, setIsHydrating] = useState(true)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)

  useEffect(() => {
    const bootstrapAbortController = new AbortController()

    const hydrateForm = async () => {
      setBootstrapError(null)
      setIsHydrating(true)

      try {
        const bootstrapContext = await loadBootstrapContext({
          signal: bootstrapAbortController.signal,
        })

        setFormContext({
          profile: bootstrapContext.profile ?? DEFAULT_PROFILE,
          geo: bootstrapContext.geo ?? {},
          settings: {
            phoneWithPrefix: bootstrapContext.settings?.phoneWithPrefix ??
              DEFAULT_SETTINGS.phoneWithPrefix,
          },
        })
      } catch (error) {
        if (isAbortError(error)) return

        setBootstrapError('Could not load profile defaults. Fallback defaults are being used.')
      } finally {
        if (!bootstrapAbortController.signal.aborted) {
          setIsHydrating(false)
        }
      }
    }

    hydrateForm()

    return () => {
      bootstrapAbortController.abort()
    }
  }, [])

  // The form renders only once context is resolved: it seeds useForm a single
  // time from that snapshot, and no re-seed (reset) path exists downstream.
  if (isHydrating) {
    return (
      <main className='page'>
        <section className='panel'>
          <p aria-busy='true'>Loading profile…</p>
        </section>
      </main>
    )
  }

  return (
    <Renderer
      bootstrapError={bootstrapError}
      formContext={formContext}
      submitMutation={(request) => onboardingApiClient.saveOnboarding(request)}
    />
  )
}
