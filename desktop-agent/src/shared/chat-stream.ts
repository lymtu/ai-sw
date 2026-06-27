/** 主进程 → 渲染进程的对话流事件 */
export type ChatStreamChunk =
  | { type: 'chunk'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: string }

export type ChatStreamPart =
  | { kind: 'text'; text: string }
  | { kind: 'thinking'; text: string }
