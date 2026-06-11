import type { ReactNode } from 'react'
import {
  type Control,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  useWatch,
} from 'react-hook-form'

type ObservedValues<
  TFieldValues extends FieldValues,
  TObserved extends readonly FieldPath<TFieldValues>[],
> = {
  [TFieldName in TObserved[number]]: FieldPathValue<TFieldValues, TFieldName>
}

type ValueObserverProps<
  TFieldValues extends FieldValues,
  TObserved extends readonly FieldPath<TFieldValues>[],
> = {
  control: Control<TFieldValues>
  observed: readonly [...TObserved]
  children: (observedValues: ObservedValues<TFieldValues, TObserved>) => ReactNode
}

/**
 * Typed wrapper over `useWatch` for form subtrees that depend on a small set of fields.
 *
 * It subscribes only to `observed` paths, which helps keep re-renders localized to this
 * subtree instead of watching those values at the full form component level.
 *
 * Values are handed to children keyed by field name, so a policy's `deps` can be passed
 * as `observed` and the result fed straight into `evaluatePolicy` — no call site
 * assembles a values slice by hand.
 */
export function ValueObserver<
  TFieldValues extends FieldValues,
  const TObserved extends readonly FieldPath<TFieldValues>[],
>({
  control,
  observed,
  children,
}: ValueObserverProps<TFieldValues, TObserved>) {
  const observedTuple = useWatch<TFieldValues, TObserved>({
    control,
    name: observed,
  })

  const observedValues = Object.fromEntries(
    observed.map((fieldName, index) => [fieldName, observedTuple[index]]),
  ) as ObservedValues<TFieldValues, TObserved>

  return <>{children(observedValues)}</>
}
