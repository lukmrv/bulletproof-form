import { type HTMLInputTypeAttribute, memo } from 'react'
import type { ControlledFieldProps } from './types'

interface TextFieldProps extends ControlledFieldProps<string, HTMLInputElement> {
  type?: HTMLInputTypeAttribute
}

export const TextField = memo(({
  value,
  onChange,
  onBlur,
  inputRef,
  error,
  label,
  helperText,
  placeholder,
  required,
  disabled,
  type,
}: TextFieldProps) => {
  return (
    <label className='field'>
      <span className='label'>
        {label}
        {required ? <span className='required-indicator' aria-hidden='true'>*</span> : null}
      </span>
      {helperText ? <span className='hint'>{helperText}</span> : null}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        ref={inputRef}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
      {error ? <span className='error'>{error}</span> : null}
    </label>
  )
})
