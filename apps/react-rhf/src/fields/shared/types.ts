import type React from 'react'

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
}
