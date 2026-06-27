import { useChatAnywhere, useMessages } from '@agentscope-ai/chat'
import { useEffect, useMemo } from 'react'
import type { ChatMessagesApi } from './chat-messages-api'

type Props = {
  setRuntime: (api: ChatMessagesApi | null) => void
}

/** 在 ChatAnywhere 子树内注册消息 API */
export function ChatRuntimeBridge({ setRuntime }: Props) {
  const messages = useMessages()
  const setLoading = useChatAnywhere((v) => v.setLoading)

  const api = useMemo<ChatMessagesApi>(
    () => ({
      updateMessage: messages.updateMessage,
      removeAllMessages: messages.removeAllMessages,
      getMessages: messages.getMessages,
      setMessages: (next) => messages.setMessages(next),
      setLoading,
    }),
    [
      messages.updateMessage,
      messages.removeAllMessages,
      messages.getMessages,
      messages.setMessages,
      setLoading,
    ],
  )

  useEffect(() => {
    setRuntime(api)
    return () => setRuntime(null)
  }, [api, setRuntime])

  return null
}
