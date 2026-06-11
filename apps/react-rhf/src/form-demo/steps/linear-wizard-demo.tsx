import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { CheckboxField } from '../../components/checkbox-field'
import { SelectField } from '../../components/select-field'
import { TextField } from '../../components/text-field'
import { ACCOUNT_TYPE_OPTIONS } from '../field-contracts/account-type'
import { COUNTRY_OPTIONS } from '../field-contracts/country'
import { PREFERRED_CONTACT_OPTIONS } from '../field-contracts/preferred-contact'
import { contentFactory } from '../factories/content-factory'
import { defaultValuesFactory } from '../factories/default-values-factory'
import { payloadFactory } from '../factories/payload-factory'
import { submitErrorFactory } from '../factories/submit-error-factory'
import { validationFactory } from '../factories/validation-factory'
import { OnboardingFormOrchestrator, type OnboardingFormRenderContract } from '../orchestration'
import { buildConditionalFieldPolicy, FIELD_POLICIES } from '../policies'
import { applySubmitErrors } from '../shared/apply-submit-response'
import { ValueObserver } from '../shared/value-observer'
import { canAdvanceStep } from './step-flow'
import {
  ACCOUNT_STEP,
  CONTACT_STEP,
  getStepSummary,
  IDENTITY_STEP,
  type OnboardingStepId,
} from './wizard-steps'

export function LinearWizardOnboardingFormRHF() {
  return (
    <OnboardingFormOrchestrator
      renderer={LinearWizardOnboardingFormRenderer}
    />
  )
}

function LinearWizardOnboardingFormRenderer({
  bootstrapError,
  formContext,
  isHydrating,
  submitMutation,
}: OnboardingFormRenderContract) {
  const [activeStepId, setActiveStepId] = useState<OnboardingStepId>('identity')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { profile, settings } = formContext
  const validationSchema = useMemo(() => validationFactory({ settings, profile }), [
    settings,
    profile,
  ])
  const fieldContent = useMemo(() => contentFactory({ profile, settings }), [profile, settings])

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
    trigger,
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

  const goBack = () => {
    if (activeStepId === 'contact') {
      setActiveStepId('account')
      return
    }

    if (activeStepId === 'account') {
      setActiveStepId('identity')
    }
  }

  const goFromIdentityToAccount = async () => {
    const canAdvance = await canAdvanceStep(
      IDENTITY_STEP,
      (fields) => trigger([...fields], { shouldFocus: true }),
    )

    if (canAdvance) {
      setActiveStepId('account')
    }
  }

  const goFromAccountToContact = async () => {
    const canAdvance = await canAdvanceStep(
      ACCOUNT_STEP,
      (fields) => trigger([...fields], { shouldFocus: true }),
    )

    if (canAdvance) {
      setActiveStepId('contact')
    }
  }

  return (
    <main className='page'>
      <section className='panel'>
        <header className='panel-header'>
          <div>
            <h1>Linear wizard</h1>
            <p>Step-local validation with final full-form payload composition.</p>
          </div>
          <span className='chip'>{getStepSummary(activeStepId)}</span>
        </header>

        <ol className='stepper' aria-label='Onboarding steps'>
          <li className={activeStepId === 'identity' ? 'active' : 'done'}>
            {IDENTITY_STEP.label}
          </li>
          <li
            className={activeStepId === 'account'
              ? 'active'
              : activeStepId === 'contact'
              ? 'done'
              : ''}
          >
            {ACCOUNT_STEP.label}
          </li>
          <li className={activeStepId === 'contact' ? 'active' : ''}>
            {CONTACT_STEP.label}
          </li>
        </ol>

        <form onSubmit={onFormSubmit} noValidate aria-busy={isHydrating || isSubmitting}>
          <fieldset className='form-fieldset' disabled={isHydrating || isSubmitting}>
            {activeStepId === 'identity' && (
              <>
                <div className='grid grid-2'>
                  <Controller
                    name='first_name'
                    control={control}
                    render={(
                      { field: { onBlur, onChange, ref, value }, fieldState: { error } },
                    ) => (
                      <TextField
                        value={value}
                        onBlur={onBlur}
                        onChange={onChange}
                        inputRef={ref}
                        error={error?.message}
                        label={fieldContent.first_name.label}
                        required={fieldContent.first_name.required}
                      />
                    )}
                  />

                  <Controller
                    name='email'
                    control={control}
                    render={(
                      { field: { onBlur, onChange, ref, value }, fieldState: { error } },
                    ) => (
                      <TextField
                        value={value}
                        onBlur={onBlur}
                        onChange={onChange}
                        inputRef={ref}
                        error={error?.message}
                        label={fieldContent.email.label}
                        required={fieldContent.email.required}
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
                      label={fieldContent.username.label}
                      helperText={fieldContent.username.helperText}
                      required={fieldContent.username.required}
                    />
                  )}
                />
              </>
            )}

            {activeStepId === 'account' && (
              <>
                <div className='grid grid-2'>
                  <Controller
                    name='account_type'
                    control={control}
                    render={(
                      { field: { onBlur, onChange, ref, value }, fieldState: { error } },
                    ) => (
                      <SelectField
                        value={value}
                        onBlur={onBlur}
                        onChange={onChange}
                        inputRef={ref}
                        error={error?.message}
                        label={fieldContent.account_type.label}
                        required={fieldContent.account_type.required}
                        options={ACCOUNT_TYPE_OPTIONS}
                      />
                    )}
                  />

                  <Controller
                    name='country'
                    control={control}
                    render={(
                      { field: { onBlur, onChange, ref, value }, fieldState: { error } },
                    ) => (
                      <SelectField
                        value={value}
                        onBlur={onBlur}
                        onChange={onChange}
                        inputRef={ref}
                        error={error?.message}
                        label={fieldContent.country.label}
                        required={fieldContent.country.required}
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
                            label={fieldContent.company_name.label}
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
                            label={fieldContent.state.label}
                            required={statePolicy.required}
                          />
                        )}
                      />
                    )
                  }}
                </ValueObserver>
              </>
            )}

            {activeStepId === 'contact' && (
              <>
                <div className='grid grid-2'>
                  <Controller
                    name='preferred_contact'
                    control={control}
                    render={(
                      { field: { onBlur, onChange, ref, value }, fieldState: { error } },
                    ) => (
                      <SelectField
                        value={value}
                        onBlur={onBlur}
                        onChange={onChange}
                        inputRef={ref}
                        error={error?.message}
                        label={fieldContent.preferred_contact.label}
                        required={fieldContent.preferred_contact.required}
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
                              label={fieldContent.phone_number.label}
                              helperText={fieldContent.phone_number.helperText}
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
                      label={fieldContent.newsletter_opt_in.label}
                    />
                  )}
                />
              </>
            )}

            <div className='actions split-actions'>
              <button
                type='button'
                onClick={goBack}
                disabled={activeStepId === 'identity' || isHydrating}
              >
                Back
              </button>

              {activeStepId === 'identity' && (
                <button
                  type='button'
                  onClick={goFromIdentityToAccount}
                  disabled={isHydrating || isSubmitting}
                >
                  Next
                </button>
              )}
              {activeStepId === 'account' && (
                <button
                  type='button'
                  onClick={goFromAccountToContact}
                  disabled={isHydrating || isSubmitting}
                >
                  Next
                </button>
              )}
              {activeStepId === 'contact' && (
                <button type='submit' disabled={isHydrating || isSubmitting}>
                  Submit
                </button>
              )}
            </div>
          </fieldset>
        </form>

        {!!bootstrapError && <p className='form-error'>{bootstrapError}</p>}
        {!!submitError && <p className='form-error'>{submitError}</p>}
      </section>
    </main>
  )
}
