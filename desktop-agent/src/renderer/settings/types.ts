import type { PublicConfig } from '../../shared/types'

export type SettingsPanelProps = {
  config: PublicConfig
  apiKeys: Record<string, string>
  onApiKeyChange: (providerId: string, value: string) => void
  onConfigChange: (updater: (config: PublicConfig) => PublicConfig) => void
}
