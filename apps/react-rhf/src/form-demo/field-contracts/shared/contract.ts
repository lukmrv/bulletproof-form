import type { ZodType } from 'zod'

interface FieldContractBase<TValue, TDefaultContext> {
  normalizeValue: (value: unknown) => TValue
  defaultDataFactory: (context: TDefaultContext) => TValue
}

export interface StaticValidationFieldContract<TValue, TDefaultContext>
  extends FieldContractBase<TValue, TDefaultContext> {
  validationSchema: ZodType<TValue>
}

export interface ValidationFactoryFieldContract<
  TValue,
  TDefaultContext,
  TValidationContext,
> extends FieldContractBase<TValue, TDefaultContext> {
  validationSchemaFactory: (context?: TValidationContext) => ZodType<TValue>
}
