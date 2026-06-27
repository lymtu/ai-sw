import { randomUUID } from 'crypto'
import { app, safeStorage } from 'electron'
import Store from 'electron-store'
import {
  DEFAULT_CONFIG,
  DEFAULT_PROVIDERS,
  type AppConfig,
  type Provider,
  type PublicConfig,
  type PublicProvider,
} from '../shared/types'
import {
  normalizeLocalWhisperLanguage,
  normalizeLocalWhisperModel,
} from '../shared/whisper-local'

interface LegacyStoredConfig extends Partial<AppConfig> {
  baseUrl?: string
  chatModel?: string
  encryptedApiKey?: string
}

interface StoredConfig extends AppConfig {
  encryptedApiKeys?: Record<string, string>
  /** @deprecated migrated to encryptedApiKeys */
  encryptedApiKey?: string
  baseUrl?: string
  chatModel?: string
}

const store = new Store<StoredConfig>({
  name: 'desktop-agent-config',
  defaults: { ...DEFAULT_CONFIG, encryptedApiKeys: {} },
})

function encryptApiKey(key: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    return Buffer.from(key, 'utf8').toString('base64')
  }
  return safeStorage.encryptString(key).toString('base64')
}

function decryptApiKey(encrypted: string): string | undefined {
  try {
    const buf = Buffer.from(encrypted, 'base64')
    if (!safeStorage.isEncryptionAvailable()) {
      return buf.toString('utf8')
    }
    return safeStorage.decryptString(buf)
  } catch {
    return undefined
  }
}

function migrateLegacyConfig(data: LegacyStoredConfig & StoredConfig): void {
  if (data.providers?.length) return

  const legacyKey = data.encryptedApiKey
  const providerId = 'default'
  const baseUrl = data.baseUrl ?? DEFAULT_CONFIG.providers[0]!.baseUrl
  const chatModel = data.chatModel ?? DEFAULT_CONFIG.providers[0]!.models[0]!.model

  const providers: Provider[] = [
    {
      id: providerId,
      name: '默认供应商',
      baseUrl,
      models: [
        {
          id: 'default-model',
          name: chatModel,
          model: chatModel,
        },
      ],
    },
  ]

  const encryptedApiKeys: Record<string, string> = { ...(data.encryptedApiKeys ?? {}) }
  if (legacyKey) {
    encryptedApiKeys[providerId] = legacyKey
  }

  store.set({
    ...data,
    providers,
    activeProviderId: providerId,
    activeModelId: 'default-model',
    encryptedApiKeys,
    encryptedApiKey: undefined,
    baseUrl: undefined,
    chatModel: undefined,
  })
}

function normalizeProviders(providers: Provider[] | undefined): Provider[] {
  if (!providers?.length) return [...DEFAULT_PROVIDERS]
  return providers.map((p) => ({
    id: p.id || randomUUID(),
    name: p.name ?? '',
    baseUrl: p.baseUrl ?? '',
    models: (p.models ?? []).map((m) => ({
      id: m.id || randomUUID(),
      name: m.name ?? '',
      model: m.model ?? '',
    })),
  }))
}

function resolveActiveIds(
  providers: Provider[],
  activeProviderId?: string,
  activeModelId?: string,
): { activeProviderId: string; activeModelId: string } {
  const provider =
    providers.find((p) => p.id === activeProviderId) ?? providers[0]!
  const model = provider.models.find((m) => m.id === activeModelId)
  return {
    activeProviderId: provider.id,
    activeModelId: model?.id ?? provider.models[0]?.id ?? '',
  }
}

export function getPublicConfig(): PublicConfig {
  migrateLegacyConfig(store.store)
  const data = store.store

  const providers = normalizeProviders(data.providers)
  const { activeProviderId, activeModelId } = resolveActiveIds(
    providers,
    data.activeProviderId,
    data.activeModelId,
  )
  const keys = data.encryptedApiKeys ?? {}

  const publicProviders: PublicProvider[] = providers.map((p) => ({
    ...p,
    apiKeySet: Boolean(keys[p.id]),
  }))

  return {
    providers: publicProviders,
    activeProviderId,
    activeModelId,
    whisperModel: data.whisperModel ?? DEFAULT_CONFIG.whisperModel,
    sttMode: data.sttMode ?? DEFAULT_CONFIG.sttMode,
    localWhisperModel: normalizeLocalWhisperModel(data.localWhisperModel),
    localWhisperLanguage: normalizeLocalWhisperLanguage(
      data.localWhisperLanguage,
    ),
    systemPrompt: data.systemPrompt ?? DEFAULT_CONFIG.systemPrompt,
    hotkeyToggleOverlay:
      data.hotkeyToggleOverlay ?? DEFAULT_CONFIG.hotkeyToggleOverlay,
    hotkeyPushToTalk: data.hotkeyPushToTalk ?? DEFAULT_CONFIG.hotkeyPushToTalk,
    hotkeyToggleInputMode:
      data.hotkeyToggleInputMode ?? DEFAULT_CONFIG.hotkeyToggleInputMode,
    launchAtLogin: data.launchAtLogin ?? DEFAULT_CONFIG.launchAtLogin,
    opaqueOverlay: data.opaqueOverlay ?? DEFAULT_CONFIG.opaqueOverlay,
    theme: data.theme ?? DEFAULT_CONFIG.theme,
  }
}

export function getProviderApiKey(providerId: string): string | undefined {
  migrateLegacyConfig(store.store)
  const keys = store.get('encryptedApiKeys') ?? {}
  const encrypted = keys[providerId]
  if (!encrypted) return undefined
  return decryptApiKey(encrypted)
}

export function getActiveChatTarget(): {
  baseUrl: string
  model: string
  apiKey: string | undefined
  providerName: string
  modelName: string
} {
  const config = getPublicConfig()
  const provider =
    config.providers.find((p) => p.id === config.activeProviderId) ??
    config.providers[0]!
  const model = provider.models.find((m) => m.id === config.activeModelId)

  return {
    baseUrl: provider.baseUrl,
    model: model?.model?.trim() ?? '',
    apiKey: getProviderApiKey(provider.id),
    providerName: provider.name,
    modelName: model?.name?.trim() ?? '',
  }
}

export function getActiveSttTarget(): {
  baseUrl: string
  whisperModel: string
  apiKey: string | undefined
} {
  const { whisperModel } = getPublicConfig()
  const chat = getActiveChatTarget()
  return {
    baseUrl: chat.baseUrl,
    whisperModel,
    apiKey: chat.apiKey,
  }
}

export function saveConfig(
  partial: Partial<AppConfig> & {
    apiKeys?: Record<string, string>
  },
): PublicConfig {
  migrateLegacyConfig(store.store)
  const { apiKeys, ...rest } = partial
  const current = store.store
  const nextProviders = rest.providers
    ? normalizeProviders(rest.providers)
    : normalizeProviders(current.providers)

  const { activeProviderId, activeModelId } = resolveActiveIds(
    nextProviders,
    rest.activeProviderId ?? current.activeProviderId,
    rest.activeModelId ?? current.activeModelId,
  )

  const next: StoredConfig = {
    ...current,
    ...rest,
    providers: nextProviders,
    activeProviderId,
    activeModelId,
    encryptedApiKeys: { ...(current.encryptedApiKeys ?? {}) },
  }

  if (apiKeys) {
    for (const [providerId, key] of Object.entries(apiKeys)) {
      if (!next.encryptedApiKeys) next.encryptedApiKeys = {}
      if (key.trim()) {
        next.encryptedApiKeys[providerId] = encryptApiKey(key.trim())
      } else {
        delete next.encryptedApiKeys[providerId]
      }
    }
  }

  next.localWhisperModel = normalizeLocalWhisperModel(next.localWhisperModel)
  next.localWhisperLanguage = normalizeLocalWhisperLanguage(
    next.localWhisperLanguage,
  )

  store.set(next)
  applyLoginItemSettings(next.launchAtLogin ?? false)

  const chatRelated =
    apiKeys !== undefined ||
    rest.systemPrompt !== undefined ||
    rest.activeProviderId !== undefined ||
    rest.activeModelId !== undefined ||
    rest.providers !== undefined
  if (chatRelated) {
    void import('./services/chat-graph').then((m) => m.resetChatGraph())
  }

  return getPublicConfig()
}

export function applyLoginItemSettings(openAtLogin: boolean): void {
  app.setLoginItemSettings({ openAtLogin, openAsHidden: true })
}
