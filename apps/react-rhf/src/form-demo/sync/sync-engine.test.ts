import { describe, expect, it } from 'vitest'
import {
  addPendingFields,
  beginFieldSync,
  completeFieldSync,
  createFieldSyncSequencer,
  drainPendingFields,
  failFieldSync,
} from './sync-engine'

type TestField = 'email' | 'username'

describe('sync engine', () => {
  it('marks pending fields when a patch begins', () => {
    const sequencer = createFieldSyncSequencer<TestField>()

    expect(beginFieldSync(sequencer, ['email']).statuses).toEqual({
      email: 'pending',
    })
  })

  it('ignores stale responses for fields with newer sequences', () => {
    const sequencer = createFieldSyncSequencer<TestField>()
    const firstPatch = beginFieldSync(sequencer, ['username'])
    const secondPatch = beginFieldSync(sequencer, ['username'])

    expect(completeFieldSync(sequencer, firstPatch.sequence, ['username'])).toEqual({})
    expect(completeFieldSync(sequencer, secondPatch.sequence, ['username'])).toEqual({
      username: 'synced',
    })
  })

  it('fails only fields reported by the current patch', () => {
    const sequencer = createFieldSyncSequencer<TestField>()
    const patch = beginFieldSync(sequencer, ['email', 'username'])

    expect(failFieldSync(sequencer, patch.sequence, ['username'])).toEqual({
      username: 'failed',
    })
  })

  it('coalesces pending fields across a debounce window', () => {
    const pendingFields = new Set<TestField>()

    addPendingFields(pendingFields, ['email'])
    addPendingFields(pendingFields, ['username', 'email'])

    expect(drainPendingFields(pendingFields)).toEqual(['email', 'username'])
    expect(drainPendingFields(pendingFields)).toEqual([])
  })
})
