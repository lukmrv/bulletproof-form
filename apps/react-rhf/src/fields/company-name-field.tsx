import { memo } from 'react'
import type { ControlledFieldProps } from './shared/types'

export const CompanyNameField = memo(({
  value,
  onChange,
  onBlur,
  inputRef,
  error,
}: ControlledFieldProps<string, HTMLInputElement>) => {
  return (
    <label className='field'>
      <span className='label'>Company name</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        ref={inputRef}
      />
      {error ? <span className='error'>{error}</span> : null}
    </label>
  )
})
