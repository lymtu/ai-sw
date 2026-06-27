import { ChatRuntimeBridge } from '@renderer/shared/agentscope-chat/ChatRuntimeBridge'
import { setChatPrototypeRuntime } from './chat-prototype-runtime'

/** 在 ChatAnywhere 子树内注册消息 API（onInput.beforeUI） */
export function ChatPrototypeRuntime() {
  return <ChatRuntimeBridge setRuntime={setChatPrototypeRuntime} />
}
