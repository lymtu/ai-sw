import { ChatOpenAI } from '@langchain/openai'
import { getActiveChatTarget } from '../config'

export function createChatModel(): ChatOpenAI {
  const { baseUrl, model, apiKey } = getActiveChatTarget()

  if (!apiKey) {
    throw new Error('当前供应商未配置 API Key，请先在设置中填写')
  }

  if (!model.trim()) {
    throw new Error('请先在设置中选择对话模型')
  }

  const normalizedBase = baseUrl.replace(/\/+$/, '')

  return new ChatOpenAI({
    model,
    apiKey,
    temperature: 0.7,
    timeout: 120_000,
    maxRetries: 0,
    configuration: { baseURL: normalizedBase },
  })
}
