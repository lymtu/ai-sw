import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_CONFIG,
  type AppConfig,
  type PublicConfig,
} from '../../shared/types'
import { applyTheme } from '@renderer/shared/theme'

const initialConfig: PublicConfig = {
  ...DEFAULT_CONFIG,
  providers: DEFAULT_CONFIG.providers.map((provider) => ({
    ...provider,
    apiKeySet: false,
  })),
}

function buildApiKeysPayload(apiKeys: Record<string, string>) {
  const payload: Record<string, string> = {}
  for (const [id, key] of Object.entries(apiKeys)) {
    if (key.trim()) payload[id] = key.trim()
  }
  return payload
}

export function useSettingsConfig() {
  const [config, setConfig] = useState<PublicConfig>(initialConfig)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const loaded = await window.desktopAgent.getConfig()
    setConfig(loaded)
    applyTheme(loaded.theme)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    applyTheme(config.theme)
  }, [config.theme])

  const setApiKey = useCallback((id: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [id]: value }))
  }, [])

  const clearStatus = useCallback(() => {
    setStatus(null)
  }, [])

  const save = useCallback(async () => {
    setLoading(true)
    setStatus(null)
    try {
      const payload: Partial<AppConfig> & { apiKeys?: Record<string, string> } =
        {
          providers: config.providers.map(({ apiKeySet: _, ...provider }) => provider),
          activeProviderId: config.activeProviderId,
          activeModelId: config.activeModelId,
          whisperModel: config.whisperModel,
          sttMode: config.sttMode,
          localWhisperModel: config.localWhisperModel,
          localWhisperLanguage: config.localWhisperLanguage,
          systemPrompt: config.systemPrompt,
          hotkeyToggleOverlay: config.hotkeyToggleOverlay,
          hotkeyPushToTalk: config.hotkeyPushToTalk,
          hotkeyToggleInputMode: config.hotkeyToggleInputMode,
          launchAtLogin: config.launchAtLogin,
          opaqueOverlay: config.opaqueOverlay,
          theme: config.theme,
        }
      const keys = buildApiKeysPayload(apiKeys)
      if (Object.keys(keys).length > 0) payload.apiKeys = keys

      const result = await window.desktopAgent.saveConfig(payload)
      setConfig(result.config)
      setApiKeys({})
      applyTheme(result.config.theme)
      const warn =
        result.shortcutErrors.length > 0
          ? `（快捷键: ${result.shortcutErrors.join('; ')}）`
          : ''
      setStatus(`已保存${warn}`)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }, [apiKeys, config])

  return {
    config,
    setConfig,
    apiKeys,
    setApiKey,
    status,
    clearStatus,
    loading,
    save,
  }
}
