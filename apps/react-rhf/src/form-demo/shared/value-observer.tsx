import type { ReactNode } from 'react'
import {
  type Control,
  type FieldPath,
  type FieldPathValues,
  type FieldValues,
  useWatch,
} from 'react-hook-form'

type ValueObserverProps<
  TFieldValues extends FieldValues,
  TObserved extends readonly FieldPath<TFieldValues>[],
> = {
  control: Control<TFieldValues>
  observed: readonly [...TObserved]
  children: (observedValue: FieldPathValues<TFieldValues, TObserved>) => ReactNode
}

/**
 * Typed wrapper over `useWatch` for form subtrees that depend on a small set of fields.
 *
 * It subscribes only to `observed` paths, which helps keep re-renders localized to this
 * subtree instead of watching those values at the full form component level.
 */
export function ValueObserver<
  TFieldValues extends FieldValues,
  const TObserved extends readonly FieldPath<TFieldValues>[],
>({
  control,
  observed,
  children,
}: ValueObserverProps<TFieldValues, TObserved>) {
  const observedValue = useWatch<TFieldValues, TObserved>({
    control,
    name: observed,
  })

  return <>{children(observedValue)}</>
}
