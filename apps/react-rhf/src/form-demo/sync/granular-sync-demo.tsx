import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { CheckboxField } from '../../components/checkbox-field'
import { SelectField } from '../../components/select-field'
import { TextField } from '../../components/text-field'
import { ACCOUNT_TYPE_OPTIONS } from '../field-contracts/account-type'
import { COUNTRY_OPTIONS } from '../field-contracts/country'
import { PREFERRED_CONTACT_OPTIONS } from '../field-contracts/preferred-contact'
import { ONBOARDING_FIELD_CONTENT } from '../field-content'
import { defaultValuesFactory } from '../factories/default-values-factory'
import { payloadFactory } from '../factories/payload-factory'
import { submitErrorFactory } from '../factories/submit-error-factory'
import { validationFactory } from '../factories/validation-factory'
import { OnboardingFormOrchestrator, type OnboardingFormRenderContract } from '../orchestration'
import { buildConditionalFieldPolicy, FIELD_POLICIES } from '../policies'
import { applySubmitErrors } from '../shared/apply-submit-response'
import { ValueObserver } from '../shared/value-observer'
import {
  draftAutosaveAdapter,
  type OnboardingSyncAdapter,
  serverPatchAdapter,
} from './sync-adapters'
import { SyncStatusPanel } from './sync-status-panel'
import { useOnboardingGranularSync } from './use-onboarding-granular-sync'

export function DraftAutosaveOnboardingFormRHF() {
  return (
    <OnboardingFormOrchestrator
      renderer={DraftAutosaveOnboardingFormRenderer}
    />
  )
}

function DraftAutosaveOnboardingFormRenderer(form: OnboardingFormRenderContract) {
  return (
    <GranularSyncOnboardingFormRenderer
      {...form}
      adapter={draftAutosaveAdapter}
      heading='Draft autosave'
      summary='Changed dirty fields are debounced and saved to a mock draft snapshot.'
    />
  )
}

export function ServerPatchOnboardingFormRHF() {
  return (
    <OnboardingFormOrchestrator
      renderer={ServerPatchOnboardingFormRenderer}
    />
  )
}

function ServerPatchOnboardingFormRenderer(form: OnboardingFormRenderContract) {
  return (
    <GranularSyncOnboardingFormRenderer
      {...form}
      adapter={serverPatchAdapter}
      heading='Server patch'
      summary='Changed dirty fields are debounced into mock PATCH requests with per-field status.'
    />
  )
}

interface GranularSyncOnboardingFormRendererProps extends OnboardingFormRenderContract {
  adapter: OnboardingSyncAdapter
  heading: string
  summary: string
}

function GranularSyncOnboardingFormRenderer({
  adapter,
  bootstrapError,
  formContext,
  heading,
  isHydrating,
  summary,
  submitMutation,
}: GranularSyncOnboardingFormRendererProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { profile, settings } = formContext
  const validationSchema = useMemo(() => validationFactory({ settings, profile }), [
    settings,
    profile,
  ])

  const formMethods = useForm({
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
    setError,
    formState: { isSubmitting },
  } = formMethods

  useEffect(() => {
    reset(defaultValuesFactory(formContext))
  }, [formContext, reset])

  const onFormSubmit = handleSubmit(async (formValues) => {
    const response = await submitMutation({
      headers: {
        'content-type': 'application/json',
        'x-form-demo': 'react-rhf',
      },
      payload: payloadFactory(formValues, formContext.profile),
    })

    applySubmitErrors(submitErrorFactory(response), { setError, setSubmitError })
  }, console.warn)

  const syncState = useOnboardingGranularSync({
    adapter,
    debounceMs: 500,
    formMethods,
    profile,
    settings,
  })

  return (
    <main className='page'>
      <section className='panel'>
        <header className='panel-header'>
          <div>
            <h1>{heading}</h1>
            <p>{summary}</p>
          </div>
        </header>

        <SyncStatusPanel
          statuses={syncState.statuses}
          lastMessage={syncState.lastMessage}
          onRetryFailed={syncState.retryFailed}
        />

        <form onSubmit={onFormSubmit} noValidate aria-busy={isHydrating || isSubmitting}>
          <fieldset className='form-fieldset' disabled={isHydrating || isSubmitting}>
            <div className='grid grid-2'>
              <Controller
                name='first_name'
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <TextField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    label={ONBOARDING_FIELD_CONTENT.first_name.label}
                  />
                )}
              />

              <Controller
                name='email'
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <TextField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    label={ONBOARDING_FIELD_CONTENT.email.label}
                  />
                )}
              />
            </div>

            <Controller
              name='username'
              control={control}
              render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                <TextField
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                  inputRef={ref}
                  error={error?.message}
                  label={ONBOARDING_FIELD_CONTENT.username.label}
                  helperText={ONBOARDING_FIELD_CONTENT.username.helperText}
                />
              )}
            />

            <div className='grid grid-2'>
              <Controller
                name='account_type'
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <SelectField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    label={ONBOARDING_FIELD_CONTENT.account_type.label}
                    options={ACCOUNT_TYPE_OPTIONS}
                  />
                )}
              />

              <Controller
                name='country'
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <SelectField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    label={ONBOARDING_FIELD_CONTENT.country.label}
                    options={COUNTRY_OPTIONS}
                  />
                )}
              />
            </div>

            <ValueObserver control={control} observed={['account_type']}>
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
                      <TextField
                        value={value ?? ''}
                        onBlur={onBlur}
                        onChange={onChange}
                        inputRef={ref}
                        error={error?.message}
                        label={ONBOARDING_FIELD_CONTENT.company_name.label}
                        required={companyNamePolicy.required}
                      />
                    )}
                  />
                )
              }}
            </ValueObserver>

            <ValueObserver control={control} observed={['country']}>
              {([country]) => {
                const statePolicy = buildConditionalFieldPolicy(FIELD_POLICIES.state, {
                  country,
                  profile,
                })

                return statePolicy.visible && (
                  <Controller
                    name='state'
                    control={control}
                    render={(
                      { field: { onBlur, onChange, ref, value }, fieldState: { error } },
                    ) => (
                      <TextField
                        value={value ?? ''}
                        onBlur={onBlur}
                        onChange={onChange}
                        inputRef={ref}
                        error={error?.message}
                        label={ONBOARDING_FIELD_CONTENT.state.label}
                        required={statePolicy.required}
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
                  <SelectField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    label={ONBOARDING_FIELD_CONTENT.preferred_contact.label}
                    options={PREFERRED_CONTACT_OPTIONS}
                  />
                )}
              />

              <ValueObserver control={control} observed={['preferred_contact', 'country']}>
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
                        <TextField
                          value={value ?? ''}
                          onBlur={onBlur}
                          onChange={onChange}
                          inputRef={ref}
                          error={error?.message}
                          label={ONBOARDING_FIELD_CONTENT.phone_number.label}
                          helperText={ONBOARDING_FIELD_CONTENT.phone_number.helperText}
                          required={phoneNumberPolicy.required}
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
                <CheckboxField
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                  inputRef={ref}
                  label={ONBOARDING_FIELD_CONTENT.newsletter_opt_in.label}
                />
              )}
            />

            <div className='actions'>
              <button type='submit' disabled={isHydrating || isSubmitting}>
                Submit
              </button>
            </div>
          </fieldset>
        </form>

        {!!bootstrapError && <p className='form-error'>{bootstrapError}</p>}
        {!!submitError && <p className='form-error'>{submitError}</p>}
      </section>
    </main>
  )
}
