import type { BaseMessage } from '@langchain/core/messages'
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph'
import type { ChatStreamPart } from '../../shared/chat-stream'
import type { ChatMessage } from '../../shared/types'
import { createChatModel } from './langchain-model'
import { buildChatInputMessages, chunkText } from './langchain-messages'
import { partsFromModelChunk } from './chat-stream-parts'

type ChatGraphState = typeof MessagesAnnotation.State

async function modelNode(state: ChatGraphState): Promise<{
  messages: BaseMessage[]
}> {
  const model = createChatModel()
  const response = await model.invoke(state.messages)
  return { messages: [response] }
}

function compileChatGraph() {
  return new StateGraph(MessagesAnnotation)
    .addNode('model', modelNode)
    .addEdge(START, 'model')
    .addEdge('model', END)
    .compile()
}

let cachedGraph: ReturnType<typeof compileChatGraph> | null = null

function getChatGraph() {
  cachedGraph ??= compileChatGraph()
  return cachedGraph
}

/** 使设置变更后下次对话使用新配置 */
export function resetChatGraph(): void {
  cachedGraph = null
}

/**
 * 流式对话：直接 stream ChatOpenAI，便于拿到 reasoning_content 等思考 token。
 * 图编译仍保留给 invoke / 后续 tool 节点使用。
 */
export async function* streamChat(
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<ChatStreamPart, void, unknown> {
  const lcMessages = buildChatInputMessages(messages)
  const model = createChatModel()

  for await (const chunk of await model.stream(lcMessages, { signal })) {
    for (const part of partsFromModelChunk(chunk)) {
      yield part
    }
  }
}

/** 非流式调用（测试或后续工具链） */
export async function invokeChat(messages: ChatMessage[]): Promise<string> {
  const lcMessages = buildChatInputMessages(messages)
  const graph = getChatGraph()
  const result = await graph.invoke({ messages: lcMessages })
  const last = result.messages.at(-1)
  if (!last) return ''
  return chunkText(last)
}
