import { uuid, type TMessage } from '@agentscope-ai/chat'
import type { ChatMessage } from '../../../shared/types'
import type { ChatMessagesApi } from './chat-messages-api'

function answerFromMessage(message: TMessage): string {
  if (message.content?.trim()) return message.content.trim()
  const textCard = message.cards?.find((c) => c.code === 'Text')
  const data = textCard?.data as { content?: string } | undefined
  return typeof data?.content === 'string' ? data.content.trim() : ''
}

export function toLangGraphMessages(messages: TMessage[]): ChatMessage[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content:
        m.role === 'user'
          ? answerFromMessage(m) || (m.content ?? '').trim()
          : answerFromMessage(m),
    }))
    .filter((m) => m.content.length > 0)
}

export function chatMessagesToTMessages(messages: ChatMessage[]): TMessage[] {
  return messages.map((m) => ({
    id: uuid(),
    role: m.role,
    content: m.content,
    msgStatus: 'finished' as const,
  }))
}

export function persistFromChatApi(
  api: ChatMessagesApi,
  persistSession: (messages: ChatMessage[]) => void,
  setSessionMessages: (messages: ChatMessage[]) => void,
): void {
  const next = toLangGraphMessages(api.getMessages())
  setSessionMessages(next)
  if (next.length > 0) persistSession(next)
}
