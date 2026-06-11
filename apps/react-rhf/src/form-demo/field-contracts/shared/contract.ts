import type { ZodType } from 'zod'

/*
  The field contract is the field's complete, runtime-agnostic definition:
  how to coerce a raw value, how to derive its default from context, what makes
  it valid, and how to present it. It carries no dependency on the form runtime.

  Presentation lives here (not in a separate copy table) so a field's label,
  helper text, and placeholder travel with the field. factories/content-factory
  only aggregates these presentationFactory results — it declares no copy itself.
*/

export interface FieldContent {
  label: string
  helperText?: string
  placeholder?: string
}

interface FieldContractBase<TValue, TDefaultContext, TPresentationContext> {
  normalizeValue: (value: unknown) => TValue
  defaultDataFactory: (context: TDefaultContext) => TValue
  presentationFactory: (context?: TPresentationContext) => FieldContent
}

export interface StaticValidationFieldContract<
  TValue,
  TDefaultContext,
  TPresentationContext = void,
> extends FieldContractBase<TValue, TDefaultContext, TPresentationContext> {
  validationSchema: ZodType<TValue>
}

export interface ValidationFactoryFieldContract<
  TValue,
  TDefaultContext,
  TValidationContext,
  TPresentationContext = void,
> extends FieldContractBase<TValue, TDefaultContext, TPresentationContext> {
  validationSchemaFactory: (context?: TValidationContext) => ZodType<TValue>
}
