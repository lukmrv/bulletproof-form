import type { ZodType } from 'zod'

/*
  The field contract is the field's complete, runtime-agnostic definition:
  its canonical name, how to coerce a raw value, how to derive its default from
  context, what makes it valid (including required-ness), and how to present it.
  It carries no dependency on the form runtime.

  The name is declared on the contract and every other layer (factories,
  policies, renderer) references it as `Field.name` — field keys are never
  re-typed as string literals elsewhere.

  Presentation lives here (not in a separate copy table) so a field's label,
  helper text, and placeholder travel with the field. factories/content-factory
  only aggregates these presentationFactory results — it declares no copy itself.

  Validation is always exposed as validationSchemaFactory. Fields whose rules do
  not depend on context simply ignore the argument — one shape for every field,
  so every consumer (validation factory, required-indicator derivation) calls
  contracts the same way.
*/

export interface FieldContent {
  label: string
  helperText?: string
  placeholder?: string
}

export interface FieldContractBase<
  TName extends string,
  TValue,
  TDefaultContext,
  TValidationContext = void,
  TPresentationContext = void,
> {
  name: TName
  normalizeValue: (value: unknown) => TValue
  defaultDataFactory: (context: TDefaultContext) => TValue
  validationSchemaFactory: (context?: TValidationContext) => ZodType<TValue>
  presentationFactory: (context?: TPresentationContext) => FieldContent
}
