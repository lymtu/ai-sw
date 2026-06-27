import type { TMessage } from '@agentscope-ai/chat'

/** 在 ChatAnywhere 子树内用 useMessages / useChatAnywhere 拼出来的 API */
export interface ChatMessagesApi {
  updateMessage: (
    message: Partial<TMessage> & { id: string },
  ) => void
  removeAllMessages: () => void
  getMessages: () => TMessage[]
  setMessages: (messages: TMessage[]) => void
  setLoading: (loading: boolean) => void
}
