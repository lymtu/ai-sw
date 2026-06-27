import { Thinking, ToolCall } from '@agentscope-ai/chat'

/**
 * ChatAnywhere 的 Bubble 会把卡片渲染成 `{ code, data }` 传给组件；
 * OperateCard 预设（Thinking / ToolCall）读的是顶层 props，不是 `data`。
 */
export const AGENTSCOPE_CHAT_CARD_CONFIG = {
  Thinking: (props: { data?: React.ComponentProps<typeof Thinking> }) =>
    props.data ? <Thinking {...props.data} /> : null,
  ToolCall: (props: { data?: React.ComponentProps<typeof ToolCall> }) =>
    props.data ? <ToolCall {...props.data} /> : null,
}
