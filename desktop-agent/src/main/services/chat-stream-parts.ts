import type { AIMessageChunk } from '@langchain/core/messages'
import type { ChatStreamPart } from '../../shared/chat-stream'
import { chunkText } from './langchain-messages'

function reasoningFromChunk(chunk: AIMessageChunk): string {
  const ak = chunk.additional_kwargs ?? {}
  if (typeof ak.reasoning_content === 'string') return ak.reasoning_content
  if (typeof ak.reasoning === 'string') return ak.reasoning

  const responseMeta = chunk.response_metadata as
    | { reasoning_content?: string }
    | undefined
  if (typeof responseMeta?.reasoning_content === 'string') {
    return responseMeta.reasoning_content
  }

  return ''
}

/** 从模型流式 chunk 拆出思考区与正文（兼容 DeepSeek R1 等 reasoning 字段） */
export function partsFromModelChunk(chunk: AIMessageChunk): ChatStreamPart[] {
  const parts: ChatStreamPart[] = []
  const reasoning = reasoningFromChunk(chunk)
  if (reasoning) parts.push({ kind: 'thinking', text: reasoning })

  const text = chunkText(chunk)
  if (text) parts.push({ kind: 'text', text })

  return parts
}
