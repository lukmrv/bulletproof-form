import { memo } from 'react'
import type { ControlledFieldProps } from './types'

export const CheckboxField = memo(({
  value,
  onChange,
  onBlur,
  inputRef,
  label,
  required,
  disabled,
}: ControlledFieldProps<boolean, HTMLInputElement>) => {
  return (
    <label className='checkbox-row'>
      <input
        type='checkbox'
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        onBlur={onBlur}
        ref={inputRef}
        required={required}
        disabled={disabled}
      />
      {label}
    </label>
  )
})
