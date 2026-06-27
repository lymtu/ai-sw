import { BrowserWindow, ipcMain, type WebContents } from 'electron'
import {
  applyOverlayIgnoreMouse,
  clampOverlayBounds,
  clampOverlayMove,
  clampOverlayResize,
  resizeOverlayBottomAnchored,
  getOverlayCanvasDimensions,
  setOverlayCanvasDimensions,
  getOverlayDisplayLimits,
} from './overlay-bounds'
import type { OverlayPanelSide } from '../shared/overlay-layout'
import {
  IPC,
  type ChatMessage,
  type SettingsSection,
  type TestConnectionInput,
} from '../shared/types'
import { getPublicConfig, saveConfig } from './config'
import type { PublicConfig } from '../shared/types'
import {
  registerGlobalShortcuts,
  resumeGlobalShortcuts,
  suspendGlobalShortcuts,
} from './shortcuts'
import { streamChat, testConnection } from './services/chat'
import { transcribeAudio } from './services/stt'
import {
  clearChatSessions,
  deleteChatSession,
  getChatSession,
  listChatSessionSummaries,
  upsertChatSession,
} from './chat-history'
import { endOverlayDrag, startOverlayDrag } from './overlay-drag'
import {
  hideOverlay,
  sendToOverlay,
  showOverlay,
  showSettingsWindow,
  toggleOverlay,
} from './windows'

const activeChatRuns = new Map<number, AbortController>()

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.configGet, () => getPublicConfig())

  ipcMain.handle(
    IPC.configSave,
    (_e, payload: Parameters<typeof saveConfig>[0]) => {
      const saved = saveConfig(payload)
      const { errors } = registerGlobalShortcuts()
      broadcastConfigToOverlay(saved)
      return { config: saved, shortcutErrors: errors }
    },
  )

  ipcMain.handle(IPC.configTest, async (_e, input?: TestConnectionInput) =>
    testConnection(input),
  )

  ipcMain.handle(IPC.overlayToggle, () => toggleOverlay())
  ipcMain.handle(IPC.overlayShow, () => {
    showOverlay()
    return true
  })
  ipcMain.handle(IPC.overlayHide, () => {
    hideOverlay()
    return true
  })

  ipcMain.handle(
    IPC.overlayShowSettings,
    (_e, section?: SettingsSection) => {
      showSettingsWindow(section, { keepOverlayFocused: true })
      return true
    },
  )

  ipcMain.handle(IPC.overlayGetPosition, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { x: 0, y: 0, width: 0, height: 0 }
    const { x, y, width, height } = win.getBounds()
    return { x, y, width, height }
  })

  ipcMain.handle(
    IPC.overlaySetPosition,
    (
      event,
      payload: { x: number; y: number; width: number; height: number },
    ) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win || payload == null) {
        return { x: 0, y: 0, width: 0, height: 0 }
      }
      const canvas = getOverlayCanvasDimensions()
      const next = clampOverlayBounds(
        win,
        payload.x,
        payload.y,
        canvas.width,
        canvas.height,
      )
      win.setBounds(next, false)
      return next
    },
  )

  ipcMain.handle(
    IPC.overlayMove,
    (
      event,
      payload: {
        x: number
        y: number
        panelSide?: OverlayPanelSide
        menuOpen?: boolean
        orbCenterOffset?: { x: number; y: number }
      },
    ) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win || payload == null) {
        return { x: 0, y: 0, width: 0, height: 0 }
      }
      const next = clampOverlayMove(win, payload.x, payload.y, {
        panelSide: payload.panelSide,
        menuOpen: payload.menuOpen,
        orbCenterOffset: payload.orbCenterOffset,
      })
      win.setPosition(next.x, next.y)
      return next
    },
  )

  ipcMain.handle(
    IPC.overlayDragStart,
    (
      event,
      payload: {
        screenX: number
        screenY: number
        orbCenterOffset: { x: number; y: number }
        menuOpen?: boolean
      },
    ) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win || payload == null) return false
      startOverlayDrag(win, payload)
      return true
    },
  )

  ipcMain.handle(IPC.overlayDragEnd, () => endOverlayDrag())

  ipcMain.handle(IPC.overlayGetCanvasSize, () => getOverlayCanvasDimensions())

  ipcMain.handle(
    IPC.overlaySetIgnoreMouseEvents,
    (event, payload: { ignore: boolean }) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win || payload == null) return false
      const { opaqueOverlay } = getPublicConfig()
      applyOverlayIgnoreMouse(win, payload.ignore, opaqueOverlay)
      return true
    },
  )

  ipcMain.handle(
    IPC.overlayResize,
    (event, payload: { width: number; height: number }) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win || payload == null) {
        return { x: 0, y: 0, width: 0, height: 0 }
      }
      const canvas = getOverlayCanvasDimensions()
      const targetH = Math.round(payload.height)
      const targetW = canvas.width
      const next = resizeOverlayBottomAnchored(win, targetW, targetH)
      setOverlayCanvasDimensions({ width: next.width, height: next.height })
      win.setBounds(next, false)
      return next
    },
  )

  ipcMain.handle(IPC.overlayGetDisplayLimits, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) {
      return {
        workAreaHeight: 0,
        maxWindowHeight: 400,
        workArea: { x: 0, y: 0, width: 1920, height: 1080 },
      }
    }
    return getOverlayDisplayLimits(win)
  })

  ipcMain.handle(
    IPC.sttTranscribe,
    async (_e, data: { buffer: ArrayBuffer; mimeType: string }) => {
      return transcribeAudio(Buffer.from(data.buffer), data.mimeType)
    },
  )

  ipcMain.handle(IPC.chatSend, async (event, messages: ChatMessage[]) => {
    activeChatRuns.get(event.sender.id)?.abort()
    const controller = new AbortController()
    activeChatRuns.set(event.sender.id, controller)
    await runChatStream(event.sender, messages, controller)
  })

  ipcMain.handle(IPC.chatCancel, (event) => {
    const controller = activeChatRuns.get(event.sender.id)
    if (!controller) return false
    controller.abort()
    activeChatRuns.delete(event.sender.id)
    return true
  })

  ipcMain.handle(IPC.chatHistoryList, () => listChatSessionSummaries())

  ipcMain.handle(IPC.chatHistoryGet, (_e, id: string) => getChatSession(id))

  ipcMain.handle(
    IPC.chatHistorySave,
    (_e, payload: { id?: string; messages: ChatMessage[] }) =>
      upsertChatSession(payload),
  )

  ipcMain.handle(IPC.chatHistoryDelete, (_e, id: string) => {
    const deleted = deleteChatSession(id)
    if (deleted) sendToOverlay(IPC.chatHistoryChanged, {})
    return deleted
  })

  ipcMain.handle(IPC.chatHistoryClear, () => {
    clearChatSessions()
    sendToOverlay(IPC.chatHistoryChanged, {})
  })

  ipcMain.handle(IPC.windowMinimize, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.handle(IPC.windowClose, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle(IPC.shortcutsSuspend, () => {
    suspendGlobalShortcuts()
  })

  ipcMain.handle(IPC.shortcutsResume, () => resumeGlobalShortcuts())

  ipcMain.handle(IPC.sttClearCache, () => {
    sendToOverlay(IPC.sttCacheCleared, {})
  })

  ipcMain.handle(
    IPC.sttNotifyCacheChanged,
    (_e, payload: { modelId?: string } | undefined) => {
      sendToOverlay(IPC.sttCacheCleared, payload ?? {})
    },
  )
}

function broadcastConfigToOverlay(config: PublicConfig): void {
  sendToOverlay(IPC.configUpdated, config)
}

async function runChatStream(
  sender: WebContents,
  messages: ChatMessage[],
  controller: AbortController,
): Promise<void> {
  const channel = IPC.chatStream
  try {
    for await (const part of streamChat(messages, controller.signal)) {
      if (sender.isDestroyed()) return
      if (part.kind === 'thinking') {
        sender.send(channel, { type: 'thinking', text: part.text })
      } else {
        sender.send(channel, { type: 'chunk', text: part.text })
      }
    }
    if (!sender.isDestroyed()) {
      sender.send(channel, { type: 'done' })
    }
  } catch (e) {
    if (controller.signal.aborted) {
      if (!sender.isDestroyed()) sender.send(channel, { type: 'done' })
      return
    }
    if (!sender.isDestroyed()) {
      sender.send(channel, {
        type: 'error',
        error: e instanceof Error ? e.message : '未知错误',
      })
    }
  } finally {
    if (activeChatRuns.get(sender.id) === controller) {
      activeChatRuns.delete(sender.id)
    }
  }
}
