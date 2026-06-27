import { uuid, type TMessage } from '@agentscope-ai/chat'
import type { ChatMessage } from '../../../shared/types'
import type { ChatMessagesApi } from './chat-messages-api'
import {
  beginAgentscopeChatStream,
  bindAgentscopeChatStream,
  endAgentscopeChatStream,
} from './chat-stream'
import { mergeStreamText, resolveDisplayAnswer } from './chat-think'
import { toLangGraphMessages } from './langgraph-messages'

type AssistantCards = NonNullable<
  Parameters<ChatMessagesApi['updateMessage']>[0]['cards']
>

function buildAssistantCards(
  thinking: string,
  status: 'generating' | 'finished',
  opts: { keepThinkingCard: boolean; hasAnswer: boolean },
): AssistantCards {
  const cards: AssistantCards = []
  const isGenerating = status === 'generating'
  const hasThinking = thinking.trim().length > 0
  const { hasAnswer } = opts

  if (opts.keepThinkingCard || (isGenerating && !hasAnswer)) {
    const thinkingInProgress = isGenerating && !hasAnswer
    cards.push({
      code: 'Thinking',
      data: {
        title: thinkingInProgress ? '思考中…' : hasThinking ? '思考过程' : '思考中…',
        content: thinking,
        loading: thinkingInProgress,
        defaultOpen: true,
      },
    })
  }

  return cards
}

export async function sendAgentscopeChat(
  api: ChatMessagesApi,
  query: string,
  signal: { cancelled: boolean },
): Promise<void> {
  const trimmed = query.trim()
  if (!trimmed) return

  const payload: ChatMessage[] = [
    ...toLangGraphMessages(api.getMessages()),
    { role: 'user', content: trimmed },
  ]

  api.updateMessage({
    id: uuid(),
    role: 'user',
    content: trimmed,
    msgStatus: 'finished',
  })

  const assistantId = uuid()
  let reasoningBuf = ''
  let textBuf = ''
  let frozenThinking = ''
  let frozenAnswer = ''
  let keepThinkingCard = false

  const pushAssistant = (status: 'generating' | 'finished') => {
    const { thinking } = mergeStreamText(reasoningBuf, textBuf)
    const isGenerating = status === 'generating'

    if (thinking.length > frozenThinking.length) {
      frozenThinking = thinking
    }
    if (frozenThinking.trim()) {
      keepThinkingCard = true
    }

    const resolvedAnswer = resolveDisplayAnswer(reasoningBuf, textBuf)
    if (resolvedAnswer.length > frozenAnswer.length) {
      frozenAnswer = resolvedAnswer
    }

    const displayAnswer = frozenAnswer
    const hasAnswer = displayAnswer.length > 0

    if (isGenerating && !hasAnswer) {
      keepThinkingCard = true
    }

    const cards = buildAssistantCards(frozenThinking || thinking, status, {
      keepThinkingCard,
      hasAnswer,
    })

    const patch: Partial<TMessage> & { id: string } = {
      id: assistantId,
      role: 'assistant',
      msgStatus: status,
      cards: cards.length > 0 ? cards : [],
    }

    if (displayAnswer) {
      patch.content = displayAnswer
    }

    api.updateMessage(patch)
  }

  pushAssistant('generating')

  const generation = beginAgentscopeChatStream()

  try {
    await new Promise<void>((resolve, reject) => {
      bindAgentscopeChatStream(generation, (chunk) => {
        if (signal.cancelled) return
        if (chunk.type === 'thinking' && chunk.text) {
          reasoningBuf += chunk.text
          pushAssistant('generating')
        } else if (chunk.type === 'chunk' && chunk.text) {
          textBuf += chunk.text
          pushAssistant('generating')
        } else if (chunk.type === 'done') {
          pushAssistant('finished')
          resolve()
        } else if (chunk.type === 'error') {
          reject(new Error(chunk.error ?? '发送失败'))
        }
      })

      void window.desktopAgent.sendChat(payload).catch((err) => {
        reject(err instanceof Error ? err : new Error('发送失败'))
      })
    })
  } finally {
    endAgentscopeChatStream(generation)
  }
}
