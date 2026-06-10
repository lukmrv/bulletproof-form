import type React from 'react'

/*
  Shared prop vocabulary for every reusable input in this library.

  Inputs are dumb and library-agnostic: they receive controlled wiring and
  presentational content, render, and report user intent. They never reach for
  ambient state, copy, or translations — the form/contract layer hands all of
  that in. Input-specific needs (a select's options, a numeric input's bounds)
  extend this base rather than reinventing it.
*/
export type ControlledFieldProps<
  TValue,
  TElement extends HTMLElement = HTMLElement,
  TError = string,
> = {
  value: TValue
  onChange: (value: TValue) => void
  onBlur: () => void
  inputRef: React.Ref<TElement>
  error?: TError
  label: string
  helperText?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export interface SelectOption<TValue> {
  value: TValue
  label: string
}
