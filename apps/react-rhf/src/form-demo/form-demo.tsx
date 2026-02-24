import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { AccountTypeField } from '../fields/account-type-field'
import { CompanyNameField } from '../fields/company-name-field'
import { CountryField } from '../fields/country-field'
import { EmailField } from '../fields/email-field'
import { FirstNameField } from '../fields/first-name-field'
import { NewsletterField } from '../fields/newsletter-field'
import { PhoneNumberField } from '../fields/phone-number-field'
import { PreferredContactField } from '../fields/preferred-contact-field'
import { StateField } from '../fields/state-field'
import { UsernameField } from '../fields/username-field'
import type { OnboardingValidationSettings } from '../_domain/types'
import { ACCOUNT_TYPE_OPTIONS } from './field-contracts/account-type'
import { COUNTRY_OPTIONS } from './field-contracts/country'
import { PREFERRED_CONTACT_OPTIONS } from './field-contracts/preferred-contact'
import { defaultValuesFactory } from './factories/default-values-factory'
import { payloadFactory } from './factories/payload-factory'
import { validationFactory } from './factories/validation-factory'
import { ValueObserver } from './shared/value-observer'
import type { SimpleOnboardingFormValues, SimpleOnboardingSubmitResult } from './types'
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, type Profile } from './default-context'
import { buildConditionalFieldPolicy, FIELD_POLICIES } from './policies'
import { isAbortError, loadBootstrapContext } from './shared/_bootstrap'

export function SimpleOnboardingFormRHF() {
  const [settings, setSettings] = useState<OnboardingValidationSettings>(DEFAULT_SETTINGS)
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [isHydrating, setIsHydrating] = useState(true)

  // dev/demo states
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [demoResult, setDemoResult] = useState<SimpleOnboardingSubmitResult | null>(null)

  const validationSchema = useMemo(() => validationFactory({ settings, profile }), [
    settings,
    profile,
  ])

  const formMethods = useForm<SimpleOnboardingFormValues>({
    defaultValues: defaultValuesFactory(),
    resolver: zodResolver(validationSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldUnregister: true,
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = formMethods

  useEffect(() => {
    const bootstrapAbortController = new AbortController()

    const hydrateForm = async () => {
      setBootstrapError(null)
      setIsHydrating(true)

      try {
        const bootstrapContext = await loadBootstrapContext({
          signal: bootstrapAbortController.signal,
        })

        setSettings({
          phoneWithPrefix: bootstrapContext.settings?.phoneWithPrefix ??
            DEFAULT_SETTINGS.phoneWithPrefix,
        })
        setProfile({ company_name: bootstrapContext.profile?.company_name })

        reset(defaultValuesFactory(bootstrapContext))
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
  }, [reset])

  const onSubmit = handleSubmit((formValues) => {
    const requestPayload = payloadFactory(formValues, profile)

    setDemoResult({
      message: 'Payload prepared by payloadFactory',
      payload: requestPayload,
    })
    console.log('form values', formValues)
    console.log('form payload', requestPayload)
  }, console.warn)

  return (
    <main className='page'>
      <section className='panel'>
        <header className='panel-header'>
          <div>
            <h1>Bulletproof Forms</h1>
          </div>
        </header>

        <form onSubmit={onSubmit} noValidate aria-busy={isHydrating || isSubmitting}>
          <fieldset className='form-fieldset' disabled={isHydrating || isSubmitting}>
            <div className='grid grid-2'>
              <Controller
                name='first_name'
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <FirstNameField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                  />
                )}
              />

              <Controller
                name='email'
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <EmailField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                  />
                )}
              />
            </div>

            <Controller
              name='username'
              control={control}
              render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                <UsernameField
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                  inputRef={ref}
                  error={error?.message}
                />
              )}
            />

            <div className='grid grid-2'>
              <Controller
                name='account_type'
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <AccountTypeField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    options={ACCOUNT_TYPE_OPTIONS}
                  />
                )}
              />

              <Controller
                name='country'
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <CountryField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    options={COUNTRY_OPTIONS}
                  />
                )}
              />
            </div>

            <ValueObserver
              control={control}
              observed={['account_type']}
            >
              {([account_type]) => {
                const companyNamePolicy = buildConditionalFieldPolicy(
                  FIELD_POLICIES.company_name,
                  {
                    account_type,
                    profile,
                  },
                )
                return companyNamePolicy.visible && (
                  <Controller
                    name='company_name'
                    control={control}
                    render={(
                      { field: { onBlur, onChange, ref, value }, fieldState: { error } },
                    ) => (
                      <CompanyNameField
                        value={value ?? ''}
                        onBlur={onBlur}
                        onChange={onChange}
                        inputRef={ref}
                        error={error?.message}
                      />
                    )}
                  />
                )
              }}
            </ValueObserver>

            <ValueObserver
              control={control}
              observed={['country']}
            >
              {([country]) => {
                const statePolicy = buildConditionalFieldPolicy(
                  FIELD_POLICIES.state,
                  {
                    country,
                    profile,
                  },
                )

                return statePolicy.visible && (
                  <Controller
                    name='state'
                    control={control}
                    render={(
                      { field: { onBlur, onChange, ref, value }, fieldState: { error } },
                    ) => (
                      <StateField
                        value={value ?? ''}
                        onBlur={onBlur}
                        onChange={onChange}
                        inputRef={ref}
                        error={error?.message}
                      />
                    )}
                  />
                )
              }}
            </ValueObserver>

            <div className='grid grid-2'>
              <Controller
                name='preferred_contact'
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <PreferredContactField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    options={PREFERRED_CONTACT_OPTIONS}
                  />
                )}
              />

              <ValueObserver
                control={control}
                observed={['preferred_contact', 'country']}
              >
                {([preferred_contact, country]) => {
                  const phoneNumberPolicy = buildConditionalFieldPolicy(
                    FIELD_POLICIES.phone_number,
                    {
                      preferred_contact,
                      country,
                      profile,
                    },
                  )

                  return phoneNumberPolicy.visible && (
                    <Controller
                      name='phone_number'
                      control={control}
                      render={(
                        { field: { onBlur, onChange, ref, value }, fieldState: { error } },
                      ) => (
                        <PhoneNumberField
                          value={value ?? ''}
                          onBlur={onBlur}
                          onChange={onChange}
                          inputRef={ref}
                          error={error?.message}
                        />
                      )}
                    />
                  )
                }}
              </ValueObserver>
            </div>

            <Controller
              name='newsletter_opt_in'
              control={control}
              render={({ field: { onBlur, onChange, ref, value } }) => (
                <NewsletterField
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                  inputRef={ref}
                />
              )}
            />

            <div className='actions'>
              <button
                type='submit'
                className={isHydrating || isSubmitting ? 'loading-indicator' : ''}
                disabled={isHydrating || isSubmitting}
              >
                Submit
              </button>
            </div>
          </fieldset>
        </form>

        {/* dev/demo states */}
        {!!bootstrapError && <p className='form-error'>{bootstrapError}</p>}
        {!!demoResult && (
          <section className='submit-result'>
            <h2>{demoResult.message}</h2>
            <pre>{JSON.stringify(demoResult.payload, null, 2)}</pre>
          </section>
        )}
      </section>
    </main>
  )
}
