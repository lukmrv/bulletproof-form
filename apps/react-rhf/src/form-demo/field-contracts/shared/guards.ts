import type { ZodType } from 'zod'

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

interface RequiredProbeContract<TValue, TValidationContext> {
  normalizeValue: (value: unknown) => TValue
  validationSchemaFactory: (context?: TValidationContext) => ZodType<TValue>
}

/*
  The required indicator is a visual affordance, not an independently declared
  rule. It is derived from the field's validation schema so it cannot drift:
  change the schema and the asterisk follows. The probe value is the field's own
  empty representation (normalizeValue(undefined)) rather than a hardcoded '',
  so the derivation is correct for every value type — string, boolean, enum.
*/
export function deriveRequired<TValue, TValidationContext>(
  contract: RequiredProbeContract<TValue, TValidationContext>,
  context?: TValidationContext,
): boolean {
  return !contract
    .validationSchemaFactory(context)
    .safeParse(contract.normalizeValue(undefined)).success
}
