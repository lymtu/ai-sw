import { randomUUID } from '../../shared/uuid'
import type { Provider, ProviderModel, PublicConfig } from '../../shared/types'

export function createProvider(): Provider {
  return {
    id: randomUUID(),
    name: '',
    baseUrl: '',
    models: [],
  }
}

export function createModel(): ProviderModel {
  return {
    id: randomUUID(),
    name: '',
    model: '',
  }
}

export function getActiveSelection(config: PublicConfig) {
  const provider =
    config.providers.find((p) => p.id === config.activeProviderId) ??
    config.providers[0]
  const model =
    provider?.models.find((m) => m.id === config.activeModelId) ??
    provider?.models[0]
  return { provider, model }
}

export function providerLabel(name: string): string {
  const trimmed = name.trim()
  return trimmed || '未命名供应商'
}

export function modelLabel(name: string, model: string): string {
  const n = name.trim()
  const m = model.trim()
  if (n && m) return `${n} (${m})`
  if (n) return n
  if (m) return m
  return '未命名模型'
}
