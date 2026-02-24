import { memo } from 'react'
import type { ControlledFieldProps } from './shared/types'

interface CountryFieldProps extends ControlledFieldProps<string, HTMLSelectElement> {
  options: ReadonlyArray<{ value: string; label: string }>
}

export const CountryField = memo(({
  value,
  onChange,
  onBlur,
  inputRef,
  error,
  options,
}: CountryFieldProps) => {
  return (
    <label className='field'>
      <span className='label'>Country</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        ref={inputRef}
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {error ? <span className='error'>{error}</span> : null}
    </label>
  )
})
