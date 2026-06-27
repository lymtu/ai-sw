import type { TestConnectionInput } from '../../shared/types'
import {
  getActiveChatTarget,
  getProviderApiKey,
  getPublicConfig,
} from '../config'

export { streamChat } from './chat-graph'

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

export async function testConnection(
  input?: TestConnectionInput,
): Promise<{ ok: boolean; message: string }> {
  const config = getPublicConfig()
  const provider =
    config.providers.find((p) => p.id === input?.providerId) ??
    config.providers[0]

  if (!provider) {
    return { ok: false, message: '未找到供应商' }
  }

  const baseUrl = input?.baseUrl?.trim() || provider.baseUrl
  const draftKey = input?.apiKey?.trim()
  const apiKey =
    draftKey ||
    getProviderApiKey(provider.id) ||
    (input?.providerId ? getProviderApiKey(input.providerId) : undefined)

  if (!apiKey) {
    return { ok: false, message: '请先填写 API Key' }
  }

  try {
    const res = await fetch(`${normalizeBaseUrl(baseUrl)}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.ok) {
      return { ok: true, message: `${provider.name} 连接成功` }
    }
    const text = await res.text().catch(() => '')
    return {
      ok: false,
      message: `连接失败 (${res.status}): ${text.slice(0, 120)}`,
    }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : '网络错误',
    }
  }
}
