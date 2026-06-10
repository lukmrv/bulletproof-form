import type { ControlledFieldProps, SelectOption } from './types'

interface SelectFieldProps<TValue extends string>
  extends ControlledFieldProps<TValue, HTMLSelectElement> {
  options: ReadonlyArray<SelectOption<TValue>>
}

export function SelectField<TValue extends string>({
  value,
  onChange,
  onBlur,
  inputRef,
  error,
  label,
  helperText,
  required,
  disabled,
  options,
}: SelectFieldProps<TValue>) {
  return (
    <label className='field'>
      <span className='label'>{label}</span>
      {helperText ? <span className='hint'>{helperText}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
        onBlur={onBlur}
        ref={inputRef}
        required={required}
        disabled={disabled}
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
}
