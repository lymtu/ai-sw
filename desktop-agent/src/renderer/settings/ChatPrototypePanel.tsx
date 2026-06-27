import { ChatAnywhere } from '@agentscope-ai/chat'
import { Component, useCallback, useRef, useState } from 'react'
import { AgentscopeThemeProvider } from './AgentscopeThemeProvider'
import { ChatPrototypeRuntime } from './ChatPrototypeRuntime'
import { getChatPrototypeRuntime } from './chat-prototype-runtime'
import { sendSettingsChat } from './settings-chat-send'
import { cancelSettingsChatStream } from './settings-chat-stream'
import { SETTINGS_CHAT_CARD_CONFIG } from './settings-chat-cards'

class ChatPanelErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[ChatPrototypePanel]', error)
  }

  render() {
    if (this.state.error) {
      return (
        <p className="p-4 text-sm text-[var(--color-error-text)]">
          对话组件加载失败：{this.state.error.message}
        </p>
      )
    }
    return this.props.children
  }
}

export function ChatPrototypePanel() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef({ cancelled: false })

  const onSubmit = useCallback(
    async (data: { query: string }) => {
      const api = getChatPrototypeRuntime()
      if (!api || busy || !data.query.trim()) return

      setError(null)
      setBusy(true)
      cancelRef.current.cancelled = false
      api.setLoading(true)

      try {
        await sendSettingsChat(api, data.query, cancelRef.current)
      } catch (e) {
        if (!cancelRef.current.cancelled) {
          setError(e instanceof Error ? e.message : '发送失败')
        }
      } finally {
        api.setLoading(false)
        setBusy(false)
      }
    },
    [busy],
  )

  const onStop = useCallback(() => {
    cancelRef.current.cancelled = true
    cancelSettingsChatStream()
    void window.desktopAgent.cancelChat()
    getChatPrototypeRuntime()?.setLoading(false)
    setBusy(false)
  }, [])

  const clearChat = useCallback(() => {
    setError(null)
    getChatPrototypeRuntime()?.removeAllMessages()
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <header className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">对话</h1>
          <button
            type="button"
            onClick={clearChat}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            清空对话
          </button>
        </div>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          使用当前供应商与模型（LangGraph）；请在「供应商」中配置 API Key。
        </p>
        {error ? (
          <p className="mt-2 text-sm text-[var(--color-error-text)]">{error}</p>
        ) : null}
      </header>

      <AgentscopeThemeProvider className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatPanelErrorBoundary>
          <div className="agentscope-chat-prototype w-full min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
            <ChatAnywhere
              cardConfig={SETTINGS_CHAT_CARD_CONFIG}
              uiConfig={{
                welcome: null,
              }}
              onUpload={[]}
              onInput={{
                beforeUI: <ChatPrototypeRuntime />,
                onSubmit,
                placeholder: '输入消息…',
                disabled: busy,
              }}
              onStop={onStop}
            />
          </div>
        </ChatPanelErrorBoundary>
      </AgentscopeThemeProvider>
    </div>
  )
}
