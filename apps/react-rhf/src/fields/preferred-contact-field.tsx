import { memo } from 'react'
import type { PreferredContact } from '../_domain/types'
import type { ControlledFieldProps } from './shared/types'

interface PreferredContactFieldProps
  extends ControlledFieldProps<PreferredContact, HTMLSelectElement> {
  options: ReadonlyArray<{ value: PreferredContact; label: string }>
}

export const PreferredContactField = memo(({
  value,
  onChange,
  onBlur,
  inputRef,
  error,
  options,
}: PreferredContactFieldProps) => {
  return (
    <label className='field'>
      <span className='label'>Preferred contact</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as PreferredContact)}
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
