import { useEffect, useMemo, useRef, useState } from 'react'
import { type DeepMap, type FieldValues, type UseFormReturn, useWatch } from 'react-hook-form'
import type { OnboardingValidationSettings } from '../../_domain/types'
import type { Profile } from '../default-context'
import type { SimpleOnboardingFormValues } from '../types'
import {
  addPendingFields,
  beginFieldSync,
  completeFieldSync,
  createFieldSyncSequencer,
  drainPendingFields,
  failFieldSync,
  type FieldSyncStatusMap,
} from './sync-engine'
import type { OnboardingFieldName, OnboardingSyncAdapter } from './sync-adapters'

const ONBOARDING_FIELD_NAMES = [
  'first_name',
  'email',
  'username',
  'account_type',
  'company_name',
  'country',
  'state',
  'preferred_contact',
  'phone_number',
  'newsletter_opt_in',
] as const satisfies readonly OnboardingFieldName[]

interface UseOnboardingGranularSyncOptions {
  adapter: OnboardingSyncAdapter
  debounceMs: number
  formMethods: UseFormReturn<SimpleOnboardingFormValues>
  profile: Profile
  settings: OnboardingValidationSettings
}

export function useOnboardingGranularSync({
  adapter,
  debounceMs,
  formMethods,
  profile,
  settings,
}: UseOnboardingGranularSyncOptions) {
  const { control, formState, getValues } = formMethods
  const values = useWatch({ control }) as SimpleOnboardingFormValues
  const previousValuesRef = useRef<SimpleOnboardingFormValues | null>(null)
  const pendingFieldsRef = useRef(new Set<OnboardingFieldName>())
  const sequencerRef = useRef(createFieldSyncSequencer<OnboardingFieldName>())
  const [statuses, setStatuses] = useState<FieldSyncStatusMap<OnboardingFieldName>>({})
  const [lastMessage, setLastMessage] = useState<string | null>(null)

  const dirtyFields = formState.dirtyFields
  const dirtyFieldSet = useMemo(
    () => getDirtyFieldSet(dirtyFields),
    [dirtyFields],
  )

  useEffect(() => {
    if (!values) return

    const previousValues = previousValuesRef.current
    previousValuesRef.current = values

    if (!previousValues) return

    const changedFields = ONBOARDING_FIELD_NAMES.filter((field) =>
      dirtyFieldSet.has(field) && previousValues[field] !== values[field]
    )

    if (changedFields.length === 0) return

    addPendingFields(pendingFieldsRef.current, changedFields)

    const timeoutId = globalThis.setTimeout(() => {
      const fieldsToSync = drainPendingFields(pendingFieldsRef.current)

      if (fieldsToSync.length === 0) return

      const currentValues = getValues()
      const { sequence, statuses: pendingStatuses } = beginFieldSync(
        sequencerRef.current,
        fieldsToSync,
      )

      setStatuses((currentStatuses) => ({ ...currentStatuses, ...pendingStatuses }))
      setLastMessage(null)

      adapter({
        changedFields: fieldsToSync,
        values: currentValues,
        context: { profile, settings },
      })
        .then((result) => {
          const syncedStatuses = completeFieldSync(
            sequencerRef.current,
            sequence,
            result.syncedFields,
          )
          const failedStatuses = failFieldSync(
            sequencerRef.current,
            sequence,
            result.failedFields ?? [],
          )

          setStatuses((currentStatuses) => ({
            ...currentStatuses,
            ...syncedStatuses,
            ...failedStatuses,
          }))
          setLastMessage(result.message ?? null)
        })
        .catch(() => {
          const failedStatuses = failFieldSync(
            sequencerRef.current,
            sequence,
            fieldsToSync,
          )

          setStatuses((currentStatuses) => ({ ...currentStatuses, ...failedStatuses }))
          setLastMessage('Sync failed')
        })
    }, debounceMs)

    return () => {
      globalThis.clearTimeout(timeoutId)
    }
  }, [adapter, debounceMs, dirtyFieldSet, getValues, profile, settings, values])

  const retryFailed = () => {
    const failedFields = ONBOARDING_FIELD_NAMES.filter((field) => statuses[field] === 'failed')

    if (failedFields.length === 0) return

    const currentValues = getValues()
    const { sequence, statuses: pendingStatuses } = beginFieldSync(
      sequencerRef.current,
      failedFields,
    )

    setStatuses((currentStatuses) => ({ ...currentStatuses, ...pendingStatuses }))
    setLastMessage(null)

    adapter({
      changedFields: failedFields,
      values: currentValues,
      context: { profile, settings },
    })
      .then((result) => {
        setStatuses((currentStatuses) => ({
          ...currentStatuses,
          ...completeFieldSync(sequencerRef.current, sequence, result.syncedFields),
          ...failFieldSync(sequencerRef.current, sequence, result.failedFields ?? []),
        }))
        setLastMessage(result.message ?? null)
      })
      .catch(() => {
        setStatuses((currentStatuses) => ({
          ...currentStatuses,
          ...failFieldSync(sequencerRef.current, sequence, failedFields),
        }))
        setLastMessage('Sync failed')
      })
  }

  return {
    lastMessage,
    retryFailed,
    statuses,
  }
}

function getDirtyFieldSet(
  dirtyFields: Partial<Readonly<DeepMap<FieldValues, boolean>>>,
) {
  const dirtyFieldSet = new Set<OnboardingFieldName>()

  ONBOARDING_FIELD_NAMES.forEach((field) => {
    if (dirtyFields[field]) {
      dirtyFieldSet.add(field)
    }
  })

  return dirtyFieldSet
}
