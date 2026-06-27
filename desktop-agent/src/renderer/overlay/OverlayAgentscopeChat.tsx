import { ChatAnywhere } from '@agentscope-ai/chat'
import { AGENTSCOPE_CHAT_CARD_CONFIG } from '@renderer/shared/agentscope-chat/chat-cards'
import { AgentscopeThemeProvider } from '@renderer/shared/agentscope-chat/AgentscopeThemeProvider'
import { ChatRuntimeBridge } from '@renderer/shared/agentscope-chat/ChatRuntimeBridge'
import { Component, type RefObject } from 'react'
import { cn } from '@renderer/shared/cn'
import { setOverlayChatRuntime } from './overlay-chat-runtime'

class OverlayChatErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[OverlayAgentscopeChat]', error)
  }

  render() {
    if (this.state.error) {
      return (
        <p className="px-3 py-2 text-xs text-[var(--color-error-text)]">
          对话加载失败：{this.state.error.message}
        </p>
      )
    }
    return this.props.children
  }
}

type Props = {
  clamped: boolean
  streaming: boolean
  error: string | null
  messagesRef: RefObject<HTMLDivElement | null>
  errorRef: RefObject<HTMLParagraphElement | null>
  onStop: () => void
}

export function OverlayAgentscopeChat({
  clamped,
  streaming,
  error,
  messagesRef,
  errorRef,
  onStop,
}: Props) {
  return (
    <div
      ref={messagesRef}
      className={cn(
        'overlay-conversation flex w-full min-w-0 flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] ring-1 ring-black/5',
        clamped && 'h-full min-h-0 overflow-hidden',
      )}
    >
      <AgentscopeThemeProvider className="min-h-0 flex-1">
        <OverlayChatErrorBoundary>
          <div className="agentscope-chat-overlay h-full min-h-0 w-full">
            <ChatAnywhere
              cardConfig={AGENTSCOPE_CHAT_CARD_CONFIG}
              uiConfig={{ welcome: null }}
              onUpload={[]}
              onInput={{
                beforeUI: (
                  <ChatRuntimeBridge setRuntime={setOverlayChatRuntime} />
                ),
                onSubmit: async () => {},
                placeholder: '',
                disabled: true,
              }}
              onStop={streaming ? onStop : undefined}
            />
          </div>
        </OverlayChatErrorBoundary>
      </AgentscopeThemeProvider>
      {error ? (
        <p
          ref={errorRef}
          className="shrink-0 px-3 pb-2 text-xs text-[var(--color-error-text)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
