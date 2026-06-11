import { useEffect, useMemo, useState } from 'react'
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
import { buildConditionalFieldPolicy, FIELD_POLICIES } from './policies'
import { applySubmitErrors } from './shared/apply-submit-response'
import { ValueObserver } from './shared/value-observer'

export function SimpleOnboardingFormRHF() {
  return <OnboardingFormOrchestrator renderer={SimpleOnboardingFormRenderer} />
}

function SimpleOnboardingFormRenderer({
  bootstrapError,
  formContext,
  isHydrating,
  submitMutation,
}: OnboardingFormRenderContract) {
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

  return (
    <main className='page'>
      <section className='panel'>
        <header className='panel-header'>
          <div>
            <h1>Baseline form</h1>
            <p>Single-page RHF form with layered fields, policies, validation, and payload.</p>
          </div>
        </header>

        <form onSubmit={onFormSubmit} noValidate aria-busy={isHydrating || isSubmitting}>
          <fieldset className='form-fieldset' disabled={isHydrating || isSubmitting}>
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

            <ValueObserver control={control} observed={[AccountTypeField.name]}>
              {([account_type]) => {
                const companyNamePolicy = buildConditionalFieldPolicy(
                  FIELD_POLICIES[CompanyNameField.name],
                  {
                    account_type,
                    profile,
                  },
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

            <ValueObserver control={control} observed={[CountryField.name]}>
              {([country]) => {
                const statePolicy = buildConditionalFieldPolicy(
                  FIELD_POLICIES[StateField.name],
                  {
                    country,
                    profile,
                  },
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
                observed={[PreferredContactField.name, CountryField.name]}
              >
                {([preferred_contact, country]) => {
                  const phoneNumberPolicy = buildConditionalFieldPolicy(
                    FIELD_POLICIES[PhoneNumberField.name],
                    {
                      preferred_contact,
                      country,
                      profile,
                    },
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
                className={isHydrating || isSubmitting ? 'loading-indicator' : ''}
                disabled={isHydrating || isSubmitting}
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
