import { memo } from 'react'
import type { AccountType } from '../_domain/types'
import type { ControlledFieldProps } from './shared/types'

interface AccountTypeFieldProps extends ControlledFieldProps<AccountType, HTMLSelectElement> {
  options: ReadonlyArray<{ value: AccountType; label: string }>
}

export const AccountTypeField = memo(({
  value,
  onChange,
  onBlur,
  inputRef,
  error,
  options,
}: AccountTypeFieldProps) => {
  return (
    <label className='field'>
      <span className='label'>Account type</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as AccountType)}
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
