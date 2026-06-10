import type { OnboardingFieldName } from './sync-adapters'
import type { FieldSyncStatusMap } from './sync-engine'

const SYNCED_FIELD_LABELS: Record<OnboardingFieldName, string> = {
  first_name: 'First name',
  email: 'Email',
  username: 'Username',
  account_type: 'Account type',
  company_name: 'Company name',
  country: 'Country',
  state: 'State',
  preferred_contact: 'Preferred contact',
  phone_number: 'Phone number',
  newsletter_opt_in: 'Newsletter',
}

interface SyncStatusPanelProps {
  lastMessage: string | null
  onRetryFailed: () => void
  statuses: FieldSyncStatusMap<OnboardingFieldName>
}

export function SyncStatusPanel({
  lastMessage,
  onRetryFailed,
  statuses,
}: SyncStatusPanelProps) {
  const visibleStatuses = Object.entries(statuses).filter(([, status]) => status !== 'idle')
  const hasFailed = visibleStatuses.some(([, status]) => status === 'failed')

  return (
    <section className='sync-panel' aria-live='polite'>
      <div className='sync-panel-header'>
        <h2>Field sync</h2>
        {hasFailed && (
          <button type='button' onClick={onRetryFailed}>
            Retry failed
          </button>
        )}
      </div>

      {lastMessage && <p>{lastMessage}</p>}

      {visibleStatuses.length > 0
        ? (
          <ul className='sync-list'>
            {visibleStatuses.map(([field, status]) => (
              <li key={field}>
                <span>{SYNCED_FIELD_LABELS[field as OnboardingFieldName]}</span>
                <span className={`chip ${status}`}>{status}</span>
              </li>
            ))}
          </ul>
        )
        : <p>No field changes synced yet.</p>}
    </section>
  )
}
