import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatSessionSummary } from '../../shared/chat-history'
import type { ChatMessage } from '../../shared/types'

type Params = {
  onSelectStart: () => void
}

export function useOverlayChatSessions({ onSelectStart }: Params) {
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const activeSessionIdRef = useRef<string | null>(null)

  const loadChatSessions = useCallback(() => {
    void window.desktopAgent
      .listChatSessions()
      .then(setChatSessions)
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadChatSessions()
  }, [loadChatSessions])

  const syncSessionsFromStore = useCallback(() => {
    void window.desktopAgent.listChatSessions().then((list) => {
      setChatSessions(list)
      setSelectedSessionId((prev) => {
        const id = activeSessionIdRef.current ?? prev
        if (id && !list.some((s) => s.id === id)) {
          activeSessionIdRef.current = null
          setSessionMessages([])
          return ''
        }
        return prev
      })
    })
  }, [])

  useEffect(() => {
    return window.desktopAgent.onChatHistoryChanged(syncSessionsFromStore)
  }, [syncSessionsFromStore])

  const persistSession = useCallback((messages: ChatMessage[]) => {
    if (messages.length === 0) return
    void window.desktopAgent
      .saveChatSession({
        id: activeSessionIdRef.current ?? undefined,
        messages,
      })
      .then((session) => {
        activeSessionIdRef.current = session.id
        setSelectedSessionId(session.id)
        void window.desktopAgent.listChatSessions().then(setChatSessions)
      })
      .catch(() => {})
  }, [])

  const selectChatSession = useCallback(
    async (sessionId: string) => {
      setSelectedSessionId(sessionId)
      onSelectStart()

      if (!sessionId) {
        activeSessionIdRef.current = null
        setSessionMessages([])
        return
      }

      const session = await window.desktopAgent.getChatSession(sessionId)
      if (!session) {
        activeSessionIdRef.current = null
        setSessionMessages([])
        setSelectedSessionId('')
        loadChatSessions()
        return
      }

      activeSessionIdRef.current = session.id
      setSessionMessages(session.messages)
    },
    [onSelectStart, loadChatSessions],
  )

  const resetSession = useCallback(() => {
    activeSessionIdRef.current = null
    setSelectedSessionId('')
    setSessionMessages([])
  }, [])

  return {
    sessionMessages,
    setSessionMessages,
    chatSessions,
    selectedSessionId,
    persistSession,
    selectChatSession,
    resetSession,
  }
}
