export interface StepDescriptor<TFieldName extends string> {
  id: string
  label: string
  fields: readonly TFieldName[]
}

export type StepTrigger<TFieldName extends string> = (
  fields: readonly TFieldName[],
) => Promise<boolean>

export function canAdvanceStep<TFieldName extends string>(
  step: StepDescriptor<TFieldName>,
  trigger: StepTrigger<TFieldName>,
) {
  return trigger(step.fields)
}
