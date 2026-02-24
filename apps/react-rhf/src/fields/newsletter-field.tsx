import { memo } from 'react'
import type { ControlledFieldProps } from './shared/types'

export const NewsletterField = memo(({
  value,
  onChange,
  onBlur,
  inputRef,
}: ControlledFieldProps<boolean, HTMLInputElement>) => {
  return (
    <label className='checkbox-row'>
      <input
        type='checkbox'
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        onBlur={onBlur}
        ref={inputRef}
      />
      Receive newsletter
    </label>
  )
})
