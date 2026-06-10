import { useState } from 'react'
import { SimpleOnboardingFormRHF } from './form-demo/form-demo'
import { LinearWizardOnboardingFormRHF } from './form-demo/steps/linear-wizard-demo'
import {
  DraftAutosaveOnboardingFormRHF,
  ServerPatchOnboardingFormRHF,
} from './form-demo/sync/granular-sync-demo'

type DemoId = 'baseline' | 'wizard' | 'draft-autosave' | 'server-patch'

export default function App() {
  const [activeDemoId, setActiveDemoId] = useState<DemoId>('baseline')

  return (
    <>
      <nav className='demo-nav' aria-label='Form demos'>
        <button
          type='button'
          className={activeDemoId === 'baseline' ? 'active' : ''}
          onClick={() => setActiveDemoId('baseline')}
        >
          Baseline
        </button>
        <button
          type='button'
          className={activeDemoId === 'wizard' ? 'active' : ''}
          onClick={() => setActiveDemoId('wizard')}
        >
          Steps
        </button>
        <button
          type='button'
          className={activeDemoId === 'draft-autosave' ? 'active' : ''}
          onClick={() => setActiveDemoId('draft-autosave')}
        >
          Draft autosave
        </button>
        <button
          type='button'
          className={activeDemoId === 'server-patch' ? 'active' : ''}
          onClick={() => setActiveDemoId('server-patch')}
        >
          Server patch
        </button>
      </nav>

      {activeDemoId === 'baseline' && <SimpleOnboardingFormRHF />}
      {activeDemoId === 'wizard' && <LinearWizardOnboardingFormRHF />}
      {activeDemoId === 'draft-autosave' && <DraftAutosaveOnboardingFormRHF />}
      {activeDemoId === 'server-patch' && <ServerPatchOnboardingFormRHF />}
    </>
  )
}
