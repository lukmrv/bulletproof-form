import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { CheckboxField } from '../components/checkbox-field'
import { SelectField } from '../components/select-field'
import { TextField } from '../components/text-field'
import { ACCOUNT_TYPE_OPTIONS, AccountTypeField } from './field-contracts/account-type'
import { CompanyNameField } from './field-contracts/company-name'
import { COUNTRY_OPTIONS, CountryField } from './field-contracts/country'
import { EmailField } from './field-contracts/email'
import { FirstNameField } from './field-contracts/first-name'
import { NewsletterField } from './field-contracts/newsletter'
import { PhoneNumberField } from './field-contracts/phone-number'
import {
  PREFERRED_CONTACT_OPTIONS,
  PreferredContactField,
} from './field-contracts/preferred-contact'
import { StateField } from './field-contracts/state'
import { UsernameField } from './field-contracts/username'
import { contentFactory } from './factories/content-factory'
import { defaultValuesFactory } from './factories/default-values-factory'
import { payloadFactory } from './factories/payload-factory'
import { submitErrorFactory } from './factories/submit-error-factory'
import { validationFactory } from './factories/validation-factory'
import { OnboardingFormOrchestrator, type OnboardingFormRenderContract } from './orchestration'
import { evaluatePolicy, FIELD_POLICIES } from './policies'
import { applySubmitErrors } from './shared/apply-submit-response'
import { ValueObserver } from './shared/value-observer'

export function SimpleOnboardingFormRHF() {
  return <OnboardingFormOrchestrator renderer={SimpleOnboardingFormRenderer} />
}

function SimpleOnboardingFormRenderer({
  bootstrapError,
  formContext,
  submitMutation,
}: OnboardingFormRenderContract) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { profile, settings } = formContext
  const validationSchema = useMemo(() => validationFactory({ settings, profile }), [
    settings,
    profile,
  ])
  const fieldContent = useMemo(() => contentFactory({ profile, settings }), [profile, settings])

  // The orchestrator renders this form only once context is resolved, so the
  // form seeds a single time from that snapshot — no re-seed (reset) path.
  const formMethods = useForm({
    defaultValues: defaultValuesFactory(formContext),
    resolver: zodResolver(validationSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldUnregister: true,
  })

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = formMethods

  const onFormSubmit = handleSubmit(async (formValues) => {
    const response = await submitMutation({
      headers: {
        'content-type': 'application/json',
        'x-form-demo': 'react-rhf',
      },
      payload: payloadFactory(formValues, formContext),
    })

    applySubmitErrors(submitErrorFactory(response), { setError, setSubmitError })
  }, console.warn)

  return (
    <main className='page'>
      <section className='panel'>
        <header className='panel-header'>
          <div>
            <h1>Baseline form</h1>
            <p>Single-page RHF form with layered fields, policies, validation, and payload.</p>
          </div>
        </header>

        <form onSubmit={onFormSubmit} noValidate aria-busy={isSubmitting}>
          <fieldset className='form-fieldset' disabled={isSubmitting}>
            <div className='grid grid-2'>
              <Controller
                name={FirstNameField.name}
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <TextField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    label={fieldContent[FirstNameField.name].label}
                    required={fieldContent[FirstNameField.name].required}
                  />
                )}
              />

              <Controller
                name={EmailField.name}
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <TextField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    label={fieldContent[EmailField.name].label}
                    required={fieldContent[EmailField.name].required}
                  />
                )}
              />
            </div>

            <Controller
              name={UsernameField.name}
              control={control}
              render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                <TextField
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                  inputRef={ref}
                  error={error?.message}
                  label={fieldContent[UsernameField.name].label}
                  helperText={fieldContent[UsernameField.name].helperText}
                  required={fieldContent[UsernameField.name].required}
                />
              )}
            />

            <div className='grid grid-2'>
              <Controller
                name={AccountTypeField.name}
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <SelectField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    label={fieldContent[AccountTypeField.name].label}
                    required={fieldContent[AccountTypeField.name].required}
                    options={ACCOUNT_TYPE_OPTIONS}
                  />
                )}
              />

              <Controller
                name={CountryField.name}
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <SelectField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    label={fieldContent[CountryField.name].label}
                    required={fieldContent[CountryField.name].required}
                    options={COUNTRY_OPTIONS}
                  />
                )}
              />
            </div>

            <ValueObserver control={control} observed={FIELD_POLICIES[CompanyNameField.name].deps}>
              {(observedValues) => {
                const companyNamePolicy = evaluatePolicy(
                  FIELD_POLICIES[CompanyNameField.name],
                  observedValues,
                  formContext,
                )

                return companyNamePolicy.visible && (
                  <Controller
                    name={CompanyNameField.name}
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
                        label={fieldContent[CompanyNameField.name].label}
                        required={fieldContent[CompanyNameField.name].required}
                      />
                    )}
                  />
                )
              }}
            </ValueObserver>

            <ValueObserver control={control} observed={FIELD_POLICIES[StateField.name].deps}>
              {(observedValues) => {
                const statePolicy = evaluatePolicy(
                  FIELD_POLICIES[StateField.name],
                  observedValues,
                  formContext,
                )

                return statePolicy.visible && (
                  <Controller
                    name={StateField.name}
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
                        label={fieldContent[StateField.name].label}
                        required={fieldContent[StateField.name].required}
                      />
                    )}
                  />
                )
              }}
            </ValueObserver>

            <div className='grid grid-2'>
              <Controller
                name={PreferredContactField.name}
                control={control}
                render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
                  <SelectField
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    inputRef={ref}
                    error={error?.message}
                    label={fieldContent[PreferredContactField.name].label}
                    required={fieldContent[PreferredContactField.name].required}
                    options={PREFERRED_CONTACT_OPTIONS}
                  />
                )}
              />

              <ValueObserver
                control={control}
                observed={FIELD_POLICIES[PhoneNumberField.name].deps}
              >
                {(observedValues) => {
                  const phoneNumberPolicy = evaluatePolicy(
                    FIELD_POLICIES[PhoneNumberField.name],
                    observedValues,
                    formContext,
                  )

                  return phoneNumberPolicy.visible && (
                    <Controller
                      name={PhoneNumberField.name}
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
                          label={fieldContent[PhoneNumberField.name].label}
                          helperText={fieldContent[PhoneNumberField.name].helperText}
                          required={fieldContent[PhoneNumberField.name].required}
                        />
                      )}
                    />
                  )
                }}
              </ValueObserver>
            </div>

            <Controller
              name={NewsletterField.name}
              control={control}
              render={({ field: { onBlur, onChange, ref, value } }) => (
                <CheckboxField
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                  inputRef={ref}
                  label={fieldContent[NewsletterField.name].label}
                />
              )}
            />

            <div className='actions'>
              <button
                type='submit'
                className={isSubmitting ? 'loading-indicator' : ''}
                disabled={isSubmitting}
              >
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
