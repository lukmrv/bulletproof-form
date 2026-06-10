import { describe, expect, it, vi } from 'vitest'
import { canAdvanceStep, type StepDescriptor } from './step-flow'

type TestField = 'first_name' | 'email'

const identityStep: StepDescriptor<TestField> = {
  id: 'identity',
  label: 'Identity',
  fields: ['first_name', 'email'],
}

describe('step flow', () => {
  it('blocks advance when step-local validation fails', async () => {
    const trigger = vi.fn().mockResolvedValue(false)

    await expect(canAdvanceStep(identityStep, trigger)).resolves.toBe(false)
    expect(trigger).toHaveBeenCalledWith(['first_name', 'email'])
  })

  it('allows advance when step-local validation passes', async () => {
    const trigger = vi.fn().mockResolvedValue(true)

    await expect(canAdvanceStep(identityStep, trigger)).resolves.toBe(true)
  })
})
