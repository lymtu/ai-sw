import type { ChatMessagesApi } from '@renderer/shared/agentscope-chat/chat-messages-api'

let runtime: ChatMessagesApi | null = null

export function setOverlayChatRuntime(api: ChatMessagesApi | null): void {
  runtime = api
}

export function getOverlayChatRuntime(): ChatMessagesApi | null {
  return runtime
}
