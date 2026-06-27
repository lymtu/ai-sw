import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { sendAgentscopeChat } from '@renderer/shared/agentscope-chat/chat-send'
import { cancelAgentscopeChatStream } from '@renderer/shared/agentscope-chat/chat-stream'
import {
  chatMessagesToTMessages,
  persistFromChatApi,
} from '@renderer/shared/agentscope-chat/langgraph-messages'
import type { ChatMessage } from '../../shared/types'
import { getOverlayChatRuntime } from './overlay-chat-runtime'

type Params = {
  sessionMessages: ChatMessage[]
  setSessionMessages: Dispatch<SetStateAction<ChatMessage[]>>
  persistSession: (messages: ChatMessage[]) => void
  onConversationStart: () => void
  onInputConsumed: () => void
}

function waitForOverlayChatRuntime(
  maxAttempts = 24,
  intervalMs = 16,
): Promise<NonNullable<ReturnType<typeof getOverlayChatRuntime>>> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const tick = () => {
      const api = getOverlayChatRuntime()
      if (api) {
        resolve(api)
        return
      }
      attempts += 1
      if (attempts >= maxAttempts) {
        reject(new Error('对话组件未就绪'))
        return
      }
      window.setTimeout(tick, intervalMs)
    }
    tick()
  })
}

export function useOverlayChatStream({
  sessionMessages,
  setSessionMessages,
  persistSession,
  onConversationStart,
  onInputConsumed,
}: Params) {
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contentTick, setContentTick] = useState(0)
  const cancelRef = useRef({ cancelled: false })

  const conversationContentVersion = useMemo(
    () => [sessionMessages.length, streaming, error ?? '', contentTick].join('\0'),
    [sessionMessages.length, streaming, error, contentTick],
  )

  useEffect(() => {
    const api = getOverlayChatRuntime()
    if (!api) return
    api.setMessages(chatMessagesToTMessages(sessionMessages))
    setContentTick((n) => n + 1)
  }, [sessionMessages])

  const resetChat = useCallback(() => {
    cancelRef.current.cancelled = true
    cancelAgentscopeChatStream()
    setError(null)
    setStreaming(false)
    getOverlayChatRuntime()?.removeAllMessages()
    getOverlayChatRuntime()?.setLoading(false)
  }, [])

  const stopStreaming = useCallback(() => {
    if (!streaming) return

    cancelRef.current.cancelled = true
    cancelAgentscopeChatStream()
    void window.desktopAgent.cancelChat()

    const api = getOverlayChatRuntime()
    if (api) {
      api.setLoading(false)
      persistFromChatApi(api, persistSession, setSessionMessages)
    }

    setStreaming(false)
    setContentTick((n) => n + 1)
  }, [streaming, persistSession, setSessionMessages])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || streaming) return

      setError(null)
      onConversationStart()
      onInputConsumed()

      cancelRef.current.cancelled = false
      setStreaming(true)

      let api: NonNullable<ReturnType<typeof getOverlayChatRuntime>>
      try {
        api = await waitForOverlayChatRuntime()
      } catch (e) {
        setError(e instanceof Error ? e.message : '对话组件未就绪')
        setStreaming(false)
        return
      }

      api.setLoading(true)
      setContentTick((n) => n + 1)

      try {
        await sendAgentscopeChat(api, trimmed, cancelRef.current)
        if (!cancelRef.current.cancelled) {
          persistFromChatApi(api, persistSession, setSessionMessages)
        }
      } catch (e) {
        if (!cancelRef.current.cancelled) {
          setError(e instanceof Error ? e.message : '发送失败')
        }
      } finally {
        api.setLoading(false)
        setStreaming(false)
        setContentTick((n) => n + 1)
      }
    },
    [
      streaming,
      onConversationStart,
      onInputConsumed,
      persistSession,
      setSessionMessages,
    ],
  )

  return {
    streaming,
    error,
    conversationContentVersion,
    resetChat,
    sendMessage,
    stopStreaming,
  }
}
