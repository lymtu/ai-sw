import type { SettingsNavId } from './SettingsSidebar'
import { AboutPanel } from './AboutPanel'
import { ChatPrototypePanel } from './ChatPrototypePanel'
import { GeneralPanel } from './GeneralPanel'
import { HistoryPanel } from './HistoryPanel'
import { PromptPanel } from './PromptPanel'
import { ProvidersPanel } from './ProvidersPanel'
import { ShortcutsPanel } from './ShortcutsPanel'
import { SttPanel } from './SttPanel'
import type { SettingsPanelProps } from './types'

export function SettingsPanel({
  nav,
  ...props
}: SettingsPanelProps & { nav: SettingsNavId }) {
  switch (nav) {
    case 'providers':
      return <ProvidersPanel {...props} />
    case 'prompt':
      return <PromptPanel {...props} />
    case 'shortcuts':
      return <ShortcutsPanel {...props} />
    case 'stt':
      return (
        <SttPanel config={props.config} onConfigChange={props.onConfigChange} />
      )
    case 'general':
      return <GeneralPanel {...props} />
    case 'chat':
      return <ChatPrototypePanel />
    case 'history':
      return <HistoryPanel />
    case 'about':
      return <AboutPanel />
    default:
      return null
  }
}
