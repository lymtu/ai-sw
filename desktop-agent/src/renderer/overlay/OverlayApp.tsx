import { useCallback, useEffect, useRef, useState } from 'react'
import type { OverlayViewMode } from '../../shared/overlay-layout'
import {
  OVERLAY_LAYOUT,
  overlayChromeRowHeight,
  overlayChromeRowOrbClusterLeft,
  overlayChromeRowPanelRect,
  overlayExpandedTopReserve,
  overlayOrbClusterWidth,
} from '../../shared/overlay-layout'
import { cn } from '@renderer/shared/cn'
import { OverlayAgentscopeChat } from './OverlayAgentscopeChat'
import { OverlayInputPill } from './OverlayInputPill'
import { OverlayOrbCluster } from './OverlayOrbCluster'
import { useOverlayChatSessions } from './useOverlayChatSessions'
import { useOverlayChatStream } from './useOverlayChatStream'
import { useOverlayConfig } from './useOverlayConfig'
import { useOverlayMousePassThrough } from './useOverlayMousePassThrough'
import { useOverlayPanelPlacement } from './useOverlayPanelPlacement'
import { useOverlayViewSize } from './useOverlayViewSize'
import { useOverlayViewState } from './useOverlayViewState'
import { useOverlayVoiceInput } from './useOverlayVoiceInput'
import { useOverlayWindowDrag } from './useOverlayWindowDrag'

type CanvasSize = {
  width: number
  height: number
}

/** 球簇在工具行内的固定 left（对称大窗水平中心，收起/展开/左右面板均不变） */
const ORB_CLUSTER_LEFT = overlayChromeRowOrbClusterLeft()

export function OverlayApp() {
  const [canvasSize, setCanvasSize] = useState<CanvasSize | null>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const orbRef = useRef<HTMLButtonElement>(null)
  const chromeRowRef = useRef<HTMLDivElement>(null)
  const conversationMessagesRef = useRef<HTMLDivElement>(null)
  const conversationErrorRef = useRef<HTMLParagraphElement>(null)

  const chatResetRef = useRef(() => {})
  const clearInputRef = useRef(() => {})
  const setViewModeRef = useRef<(mode: OverlayViewMode) => void>(() => {})
  const focusInputForModeRef = useRef(() => {})
  const enterTextModeRef = useRef((_mergePreview?: boolean) => {})
  const enterVoiceModeRef = useRef(() => {})
  const startNewSessionRef = useRef(() => {})
  const sendMessageRef = useRef((_text: string) => {})
  const hideOverlayWindowRef = useRef(() => {})

  const sessions = useOverlayChatSessions({
    onSelectStart: () => chatResetRef.current(),
  })

  const chat = useOverlayChatStream({
    sessionMessages: sessions.sessionMessages,
    setSessionMessages: sessions.setSessionMessages,
    persistSession: sessions.persistSession,
    onConversationStart: () => setViewModeRef.current('conversation'),
    onInputConsumed: () => clearInputRef.current(),
  })
  chatResetRef.current = chat.resetChat
  sendMessageRef.current = (text) => {
    void chat.sendMessage(text)
  }

  const view = useOverlayViewState({
    streaming: chat.streaming,
    stopStreaming: chat.stopStreaming,
    focusInputForMode: () => focusInputForModeRef.current(),
    enterTextMode: (mergePreview) => enterTextModeRef.current(mergePreview),
    enterVoiceMode: () => enterVoiceModeRef.current(),
    startNewSession: () => startNewSessionRef.current(),
  })
  setViewModeRef.current = view.setViewMode
  hideOverlayWindowRef.current = () => {
    void view.hideOverlayWindow()
  }

  const voice = useOverlayVoiceInput({
    chatBusy: chat.streaming,
    viewMode: view.viewMode,
    setViewMode: view.setViewMode,
    onSendMessage: (text) => sendMessageRef.current(text),
    onHideOverlay: () => hideOverlayWindowRef.current(),
  })
  clearInputRef.current = voice.clearInput
  focusInputForModeRef.current = voice.focusInputForMode
  enterTextModeRef.current = voice.enterTextMode
  enterVoiceModeRef.current = voice.enterVoiceMode

  const startNewSession = useCallback(() => {
    if (voice.voicePanelLocked || voice.recording) return
    sessions.resetSession()
    chat.resetChat()
    voice.clearInput()
    view.setViewMode('input')
    voice.focusInputForMode()
  }, [
    voice.voicePanelLocked,
    voice.recording,
    voice.clearInput,
    voice.focusInputForMode,
    sessions.resetSession,
    chat.resetChat,
    view.setViewMode,
  ])
  startNewSessionRef.current = startNewSession

  const selectChatSession = useCallback(
    (sessionId: string) => {
      if (voice.voicePanelLocked || voice.recording) return
      void sessions.selectChatSession(sessionId)
    },
    [
      voice.voicePanelLocked,
      voice.recording,
      sessions.selectChatSession,
    ],
  )

  const { opaqueOverlay } = useOverlayConfig(setCanvasSize)
  useOverlayMousePassThrough(shellRef, opaqueOverlay)

  const { conversationClamped, panelMaxCap } = useOverlayViewSize(
    view.viewMode,
    canvasSize,
    {
      chromeRowRef,
      messagesRef: conversationMessagesRef,
      contentVersion:
        view.viewMode === 'conversation' ? chat.conversationContentVersion : '',
    },
  )

  const {
    panelSide,
    onDragEnd,
    syncPanelSideFromScreen,
    captureOrbScreenCenter,
    applyPanelSideFromRef,
  } = useOverlayPanelPlacement(orbRef, canvasSize, () => view.viewModeRef.current)

  useEffect(() => {
    const prev = view.prevViewModeRef.current
    view.prevViewModeRef.current = view.viewMode
    if (prev !== 'collapsed') return
    if (view.viewMode !== 'input' && view.viewMode !== 'conversation') return
    void captureOrbScreenCenter().then(async (center) => {
      if (center) await syncPanelSideFromScreen(center.cx, { layout: false })
      applyPanelSideFromRef()
    })
  }, [
    view.viewMode,
    view.prevViewModeRef,
    captureOrbScreenCenter,
    syncPanelSideFromScreen,
    applyPanelSideFromRef,
  ])

  useOverlayWindowDrag(
    shellRef,
    view.handleOrbTap,
    onDragEnd,
    view.handleOrbContextMenu,
    canvasSize ? { menuOpen: view.radialMenuOpen } : null,
  )

  const chromeRowH = overlayChromeRowHeight()
  const canvasTopReserve = overlayExpandedTopReserve()
  const shellPadH = OVERLAY_LAYOUT.shellHorizontalPadding
  const clusterW = overlayOrbClusterWidth()
  const panelRect = overlayChromeRowPanelRect(panelSide)
  const isCollapsed = view.viewMode === 'collapsed'
  const showConversation = view.viewMode === 'conversation'
  const showInput = view.viewMode === 'input'

  const orbClusterStyle = {
    left: ORB_CLUSTER_LEFT,
    width: clusterW,
    height: chromeRowH,
  } as const

  return (
    <div
      ref={shellRef}
      className="overlay-shell overlay-canvas relative box-border overflow-visible p-1"
      style={
        canvasSize
          ? { width: canvasSize.width, height: canvasSize.height }
          : undefined
      }
    >
      <div
        className="overlay-expanded-root relative flex h-full w-full min-h-0 flex-col overflow-visible"
        style={{
          paddingTop: canvasTopReserve,
          paddingLeft: shellPadH,
          paddingRight: shellPadH,
        }}
      >
        <div
          ref={chromeRowRef}
          className="overlay-chrome-row relative w-full shrink-0"
          style={{ height: chromeRowH }}
        >
            <div
              className={cn(
                'overlay-panel-area absolute z-[1] flex min-h-0 min-w-0 flex-col',
                showConversation
                  ? 'overlay-hit-target pointer-events-auto'
                  : 'invisible pointer-events-none',
              )}
              style={{
                left: panelRect.left,
                width: panelRect.width,
                top: 0,
                maxHeight: panelMaxCap ?? undefined,
              }}
              aria-hidden={!showConversation}
            >
              <OverlayAgentscopeChat
                streaming={chat.streaming}
                error={chat.error}
                clamped={conversationClamped}
                messagesRef={conversationMessagesRef}
                errorRef={conversationErrorRef}
                onStop={chat.stopStreaming}
              />
            </div>

            <div
              className="overlay-orb-cluster absolute z-[3] flex items-center justify-center overflow-visible"
              style={orbClusterStyle}
            >
              <OverlayOrbCluster
                showRadialMenu={isCollapsed && view.showRadialMenu}
                menuOpen={isCollapsed && view.menuOpen}
                active={showConversation}
                recording={voice.recording || voice.transcribing}
                animating={chat.streaming}
                orbRef={orbRef}
                onAction={view.handleRadialAction}
              />
            </div>

            <div
              className={cn(
                'overlay-panel-area absolute z-[2] flex min-w-0 items-center',
                showInput
                  ? 'overlay-hit-target pointer-events-auto'
                  : 'invisible pointer-events-none',
              )}
              style={{
                left: panelRect.left,
                width: panelRect.width,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              aria-hidden={!showInput}
            >
              <OverlayInputPill
                  inputMode={voice.inputMode}
                  input={voice.input}
                  voicePreview={voice.voicePreview}
                  hasVoicePreview={voice.hasVoicePreview}
                  voiceStatusLabel={voice.voiceStatusLabel}
                  voiceStatusHasError={voice.voiceStatusHasError}
                  recording={voice.recording}
                  transcribing={voice.transcribing}
                  chatBusy={chat.streaming}
                  voicePanelLocked={voice.voicePanelLocked}
                  sendDisabled={voice.sendDisabled}
                  selectedSessionId={sessions.selectedSessionId}
                  chatSessions={sessions.chatSessions}
                  inputRef={voice.inputRef}
                  voiceMicRef={voice.voiceMicRef}
                  onInputChange={voice.setInput}
                  onVoicePreviewChange={voice.setVoicePreview}
                  onKeyDown={voice.handleKeyDown}
                  onToggleInputMode={voice.toggleInputMode}
                  onToggleRecording={voice.toggleRecording}
                  onDiscardVoicePreview={voice.discardVoicePreview}
                  onSelectSession={selectChatSession}
                  onSend={voice.handleSend}
                />
            </div>
        </div>
      </div>
    </div>
  )
}
