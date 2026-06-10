import type { OnboardingValidationSettings } from '../../_domain/types'
import type { Profile } from '../default-context'
import type { SimpleOnboardingFormValues } from '../types'

export type OnboardingFieldName = keyof SimpleOnboardingFormValues

export interface OnboardingSyncContext {
  profile: Profile
  settings: OnboardingValidationSettings
}

export interface OnboardingSyncRequest {
  changedFields: readonly OnboardingFieldName[]
  values: SimpleOnboardingFormValues
  context: OnboardingSyncContext
}

export interface OnboardingSyncResult {
  syncedFields: readonly OnboardingFieldName[]
  failedFields?: readonly OnboardingFieldName[]
  message?: string
}

export type OnboardingSyncAdapter = (
  request: OnboardingSyncRequest,
) => Promise<OnboardingSyncResult>

export type DraftSnapshot = Partial<
  Record<OnboardingFieldName, SimpleOnboardingFormValues[OnboardingFieldName]>
>

const draftSnapshot: DraftSnapshot = {}
const serverSnapshot: DraftSnapshot = {}

export function getDraftSnapshot() {
  return { ...draftSnapshot }
}

export function getServerSnapshot() {
  return { ...serverSnapshot }
}

export const draftAutosaveAdapter: OnboardingSyncAdapter = async ({
  changedFields,
  values,
}) => {
  await wait(300)

  changedFields.forEach((field) => {
    draftSnapshot[field] = values[field]
  })

  return {
    syncedFields: changedFields,
    message: 'Draft saved',
  }
}

export const serverPatchAdapter: OnboardingSyncAdapter = async ({
  changedFields,
  values,
}) => {
  await wait(450)

  const failedFields = changedFields.filter((field) =>
    field === 'username' && values.username.includes('taken')
  )
  const syncedFields = changedFields.filter((field) => !failedFields.includes(field))

  syncedFields.forEach((field) => {
    serverSnapshot[field] = values[field]
  })

  return {
    syncedFields,
    failedFields,
    message: failedFields.length > 0 ? 'Server rejected part of the patch' : 'Server patch saved',
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
