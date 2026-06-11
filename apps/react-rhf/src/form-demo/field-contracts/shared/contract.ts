import type { ZodType } from 'zod'

/*
  The field contract is the field's complete, runtime-agnostic definition:
  its canonical name, how to coerce a raw value, how to derive its default from
  context, what makes it valid, and how to present it. It carries no dependency
  on the form runtime.

  The name is declared on the contract and every other layer (factories,
  policies, renderer) references it as `Field.name` — field keys are never
  re-typed as string literals elsewhere.

  Presentation lives here (not in a separate copy table) so a field's label,
  helper text, and placeholder travel with the field. factories/content-factory
  only aggregates these presentationFactory results — it declares no copy itself.
*/

export interface FieldContent {
  label: string
  helperText?: string
  placeholder?: string
}

interface FieldContractBase<
  TName extends string,
  TValue,
  TDefaultContext,
  TPresentationContext,
> {
  name: TName
  normalizeValue: (value: unknown) => TValue
  defaultDataFactory: (context: TDefaultContext) => TValue
  presentationFactory: (context?: TPresentationContext) => FieldContent
}

export interface StaticValidationFieldContract<
  TName extends string,
  TValue,
  TDefaultContext,
  TPresentationContext = void,
> extends FieldContractBase<TName, TValue, TDefaultContext, TPresentationContext> {
  validationSchema: ZodType<TValue>
}

export interface ValidationFactoryFieldContract<
  TName extends string,
  TValue,
  TDefaultContext,
  TValidationContext,
  TPresentationContext = void,
> extends FieldContractBase<TName, TValue, TDefaultContext, TPresentationContext> {
  validationSchemaFactory: (context?: TValidationContext) => ZodType<TValue>
}
