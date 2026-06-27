import type { ChatMessage } from './types'

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export interface ChatSessionSummary {
  id: string
  title: string
  preview: string
  messageCount: number
  createdAt: number
  updatedAt: number
}

const TITLE_MAX = 48
const PREVIEW_MAX = 80

export function buildSessionTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser?.content.trim()) return '未命名会话'
  const t = firstUser.content.trim().replace(/\s+/g, ' ')
  return t.length > TITLE_MAX ? `${t.slice(0, TITLE_MAX)}…` : t
}

export function buildSessionPreview(messages: ChatMessage[]): string {
  const last = [...messages].reverse().find((m) => m.content.trim())
  if (!last) return ''
  const t = last.content.trim().replace(/\s+/g, ' ')
  const prefix = last.role === 'assistant' ? '助手: ' : '我: '
  const body = t.length > PREVIEW_MAX ? `${t.slice(0, PREVIEW_MAX)}…` : t
  return prefix + body
}

export function toSessionSummary(session: ChatSession): ChatSessionSummary {
  return {
    id: session.id,
    title: session.title,
    preview: buildSessionPreview(session.messages),
    messageCount: session.messages.length,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  }
}
