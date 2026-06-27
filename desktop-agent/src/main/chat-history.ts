import { randomUUID } from 'crypto'
import Store from 'electron-store'
import {
  buildSessionPreview,
  buildSessionTitle,
  toSessionSummary,
  type ChatSession,
  type ChatSessionSummary,
} from '../shared/chat-history'
import type { ChatMessage } from '../shared/types'

const MAX_SESSIONS = 200

interface HistoryStore {
  sessions: ChatSession[]
}

const store = new Store<HistoryStore>({
  name: 'desktop-agent-chat-history',
  defaults: { sessions: [] },
})

function loadSessions(): ChatSession[] {
  return store.get('sessions') ?? []
}

function saveSessions(sessions: ChatSession[]): void {
  store.set(
    'sessions',
    sessions
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_SESSIONS),
  )
}

export function listChatSessionSummaries(): ChatSessionSummary[] {
  return loadSessions().map(toSessionSummary)
}

export function getChatSession(id: string): ChatSession | null {
  return loadSessions().find((s) => s.id === id) ?? null
}

export function upsertChatSession(input: {
  id?: string
  messages: ChatMessage[]
}): ChatSession {
  const sessions = loadSessions()
  const now = Date.now()
  const id = input.id ?? randomUUID()
  const existing = sessions.find((s) => s.id === id)
  const title = buildSessionTitle(input.messages)

  const session: ChatSession = {
    id,
    title,
    messages: input.messages,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  const next = existing
    ? sessions.map((s) => (s.id === id ? session : s))
    : [session, ...sessions]

  saveSessions(next)
  return session
}

export function deleteChatSession(id: string): boolean {
  const sessions = loadSessions()
  const next = sessions.filter((s) => s.id !== id)
  if (next.length === sessions.length) return false
  saveSessions(next)
  return true
}

export function clearChatSessions(): void {
  store.set('sessions', [])
}
