import { MOCK_BOOTSTRAP_CONTEXT } from '../../_domain/const'
import type { OnboardingDefaultDataContext } from '../../_domain/types'

function abortError(): DOMException {
  return new DOMException('The operation was aborted', 'AbortError')
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', onAbort)
      reject(abortError())
    }

    signal?.addEventListener('abort', onAbort)
  })
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export async function loadBootstrapContext({
  signal,
}: { signal?: AbortSignal } = {}): Promise<Partial<OnboardingDefaultDataContext>> {
  await wait(1000, signal)
  return MOCK_BOOTSTRAP_CONTEXT
}
