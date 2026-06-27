import type { ChatMessagesApi } from './chat-messages-api'

let runtime: ChatMessagesApi | null = null

export function setChatPrototypeRuntime(api: ChatMessagesApi | null): void {
  runtime = api
}

export function getChatPrototypeRuntime(): ChatMessagesApi | null {
  return runtime
}
