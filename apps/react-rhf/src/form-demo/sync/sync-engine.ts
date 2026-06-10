export type FieldSyncStatus = 'idle' | 'pending' | 'synced' | 'failed'

export type FieldSyncStatusMap<TField extends string> = Partial<Record<TField, FieldSyncStatus>>

export interface FieldSyncSequencer<TField extends string> {
  nextSequence: number
  fieldSequences: Partial<Record<TField, number>>
}

export function createFieldSyncSequencer<TField extends string>(): FieldSyncSequencer<TField> {
  return {
    nextSequence: 1,
    fieldSequences: {},
  }
}

export function beginFieldSync<TField extends string>(
  sequencer: FieldSyncSequencer<TField>,
  fields: readonly TField[],
) {
  const sequence = sequencer.nextSequence
  sequencer.nextSequence += 1

  fields.forEach((field) => {
    sequencer.fieldSequences[field] = sequence
  })

  return {
    sequence,
    statuses: buildStatusPatch(fields, 'pending'),
  }
}

export function addPendingFields<TField extends string>(
  pendingFields: Set<TField>,
  fields: readonly TField[],
) {
  fields.forEach((field) => pendingFields.add(field))
}

export function drainPendingFields<TField extends string>(pendingFields: Set<TField>) {
  const fields = [...pendingFields]
  pendingFields.clear()
  return fields
}

export function completeFieldSync<TField extends string>(
  sequencer: FieldSyncSequencer<TField>,
  sequence: number,
  fields: readonly TField[],
) {
  return buildCurrentStatusPatch(sequencer, sequence, fields, 'synced')
}

export function failFieldSync<TField extends string>(
  sequencer: FieldSyncSequencer<TField>,
  sequence: number,
  fields: readonly TField[],
) {
  return buildCurrentStatusPatch(sequencer, sequence, fields, 'failed')
}

function buildCurrentStatusPatch<TField extends string>(
  sequencer: FieldSyncSequencer<TField>,
  sequence: number,
  fields: readonly TField[],
  status: FieldSyncStatus,
) {
  return fields.reduce<FieldSyncStatusMap<TField>>((statusPatch, field) => {
    if (sequencer.fieldSequences[field] === sequence) {
      statusPatch[field] = status
    }

    return statusPatch
  }, {})
}

function buildStatusPatch<TField extends string>(
  fields: readonly TField[],
  status: FieldSyncStatus,
) {
  return fields.reduce<FieldSyncStatusMap<TField>>((statusPatch, field) => {
    statusPatch[field] = status
    return statusPatch
  }, {})
}
