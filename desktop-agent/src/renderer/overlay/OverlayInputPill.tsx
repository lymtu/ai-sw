import type { KeyboardEvent, RefObject } from 'react'
import type { ChatSessionSummary } from '../../shared/chat-history'
import { cn } from '@renderer/shared/cn'
import { Dropdown } from '@renderer/shared/Dropdown'
import {
  IconKeyboard,
  IconMic,
  IconMicRecording,
  IconSend,
} from '@renderer/shared/icons/Icon'
import type { InputMode } from './types'

type Props = {
  inputMode: InputMode
  input: string
  voicePreview: string
  hasVoicePreview: boolean
  voiceStatusLabel: string
  voiceStatusHasError: boolean
  recording: boolean
  transcribing: boolean
  chatBusy: boolean
  voicePanelLocked: boolean
  sendDisabled: boolean
  selectedSessionId: string
  chatSessions: ChatSessionSummary[]
  inputRef: RefObject<HTMLTextAreaElement | null>
  voiceMicRef: RefObject<HTMLButtonElement | null>
  onInputChange: (value: string) => void
  onVoicePreviewChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent) => void
  onToggleInputMode: () => void
  onToggleRecording: () => void
  onDiscardVoicePreview: () => void
  onSelectSession: (sessionId: string) => void
  onSend: () => void
}

export function OverlayInputPill({
  inputMode,
  input,
  voicePreview,
  hasVoicePreview,
  voiceStatusLabel,
  voiceStatusHasError,
  recording,
  transcribing,
  chatBusy,
  voicePanelLocked,
  sendDisabled,
  selectedSessionId,
  chatSessions,
  inputRef,
  voiceMicRef,
  onInputChange,
  onVoicePreviewChange,
  onKeyDown,
  onToggleInputMode,
  onToggleRecording,
  onDiscardVoicePreview,
  onSelectSession,
  onSend,
}: Props) {
  return (
    <div className="overlay-input-pill flex h-12 w-full min-w-0 items-center gap-0 self-center rounded-full border border-[var(--color-border)] px-1 py-1 ring-1 ring-black/5">
      <button
        type="button"
        onClick={onToggleInputMode}
        disabled={recording || voicePanelLocked}
        className={cn(
          'app-no-drag flex size-9 shrink-0 items-center justify-center rounded-full',
          'text-[var(--color-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]',
          'disabled:cursor-not-allowed disabled:opacity-35',
        )}
        aria-label={inputMode === 'text' ? '切换到语音输入' : '切换到文字输入'}
        title={inputMode === 'text' ? '语音输入' : '文字输入'}
      >
        {inputMode === 'text' ? (
          <IconMic className="size-5" />
        ) : (
          <IconKeyboard className="size-5" />
        )}
      </button>

      {inputMode === 'text' ? (
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="输入消息，Enter 发送"
          rows={1}
          className={cn(
            'overlay-input app-no-drag min-h-7 min-w-0 flex-1 resize-none border-0 bg-transparent',
            'py-1 pl-0.5 pr-1 text-sm leading-snug text-[var(--color-text)] outline-none',
            'placeholder:text-[var(--color-muted)]',
          )}
        />
      ) : (
        <div className="flex min-h-7 min-w-0 flex-1 items-center gap-1.5 px-0.5">
          {hasVoicePreview ? (
            <>
              <textarea
                ref={inputRef}
                value={voicePreview}
                onChange={(e) => onVoicePreviewChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="核对识别结果，Enter 发送"
                rows={1}
                className={cn(
                  'overlay-input app-no-drag min-h-7 min-w-0 flex-1 resize-none border-0 bg-transparent',
                  'py-1 text-sm leading-snug text-[var(--color-text)] outline-none',
                  'placeholder:text-[var(--color-muted)]',
                )}
              />
              <button
                type="button"
                onClick={onDiscardVoicePreview}
                disabled={recording || voicePanelLocked}
                className={cn(
                  'app-no-drag shrink-0 text-xs text-[var(--color-muted)]',
                  'hover:text-[var(--color-text)] disabled:opacity-35',
                )}
              >
                重录
              </button>
            </>
          ) : (
            <>
              <button
                ref={voiceMicRef}
                type="button"
                onClick={onToggleRecording}
                disabled={chatBusy}
                aria-pressed={recording || transcribing}
                aria-label={
                  transcribing
                    ? '取消识别'
                    : recording
                      ? '停止录音'
                      : '开始录音'
                }
                title={
                  transcribing
                    ? '取消识别'
                    : recording
                      ? '停止录音'
                      : '开始录音'
                }
                className={cn(
                  'app-no-drag flex size-9 shrink-0 items-center justify-center rounded-full',
                  'text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10',
                  (recording || transcribing) && 'bg-[var(--color-accent)]/10',
                  chatBusy && 'cursor-not-allowed opacity-40',
                )}
              >
                {recording || transcribing ? (
                  <IconMicRecording className="size-5" />
                ) : (
                  <IconMic className="size-5" />
                )}
              </button>
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-xs',
                  voiceStatusHasError
                    ? 'text-[var(--color-error-text)]'
                    : 'text-[var(--color-muted)]',
                )}
              >
                {voiceStatusLabel}
              </span>
            </>
          )}
        </div>
      )}

      <Dropdown
        value={selectedSessionId}
        disabled={voicePanelLocked || recording}
        onChange={(value) => onSelectSession(value)}
        placeholder="新会话"
        options={[
          { value: '', label: '新会话' },
          ...chatSessions.map((session) => ({
            value: session.id,
            label: session.title,
          })),
        ]}
        className="app-no-drag mr-1 w-20 shrink-0"
        buttonClassName="h-8 rounded-lg py-1 pl-2 pr-2 text-xs"
        menuClassName="h-24 min-w-48 py-0.5"
        optionClassName="px-2 py-1.5 text-xs"
      />

      <button
        type="button"
        disabled={sendDisabled}
        onClick={onSend}
        className={cn(
          'app-no-drag flex size-9 shrink-0 items-center justify-center rounded-full',
          'text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10',
          'disabled:cursor-not-allowed disabled:opacity-35',
        )}
        aria-label="发送"
      >
        <IconSend className="size-5" />
      </button>
    </div>
  )
}
