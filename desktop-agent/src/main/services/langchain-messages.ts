import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from '@langchain/core/messages'
import type { ChatMessage } from '../../shared/types'
import { getPublicConfig } from '../config'

export function chunkText(chunk: { content: unknown }): string {
  const c = chunk.content
  if (typeof c === 'string') return c
  if (Array.isArray(c)) {
    let s = ''
    for (const p of c) {
      if (
        p &&
        typeof p === 'object' &&
        'type' in p &&
        (p as { type: string }).type === 'text' &&
        'text' in p
      ) {
        s += String((p as { text: string }).text)
      }
    }
    return s
  }
  return ''
}

export function toLangChainMessages(msgs: ChatMessage[]): BaseMessage[] {
  const out: BaseMessage[] = []
  for (const m of msgs) {
    if (m.role === 'user') out.push(new HumanMessage(m.content))
    else if (m.role === 'assistant') out.push(new AIMessage(m.content))
    else if (m.role === 'system') out.push(new SystemMessage(m.content))
  }
  return out
}

/** 合并系统提示词与对话历史，供 LangGraph / ChatOpenAI 使用 */
export function buildChatInputMessages(messages: ChatMessage[]): BaseMessage[] {
  const { systemPrompt } = getPublicConfig()
  const payload: ChatMessage[] = []
  if (systemPrompt.trim()) {
    payload.push({ role: 'system', content: systemPrompt })
  }
  payload.push(...messages)
  return toLangChainMessages(payload)
}
