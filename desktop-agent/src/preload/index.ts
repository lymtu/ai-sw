import { contextBridge, ipcRenderer } from 'electron'
import type { ChatSession, ChatSessionSummary } from '../shared/chat-history'
import {
  IPC,
  type AppConfig,
  type ChatMessage,
  type ChatStreamChunk,
  type OverlayWindowBounds,
  type PublicConfig,
  type SettingsSection,
  type TestConnectionInput,
} from '../shared/types'

export interface DesktopAgentApi {
  getConfig: () => Promise<import('../shared/types').PublicConfig>
  saveConfig: (
    config: Partial<AppConfig> & { apiKeys?: Record<string, string> },
  ) => Promise<{
    config: import('../shared/types').PublicConfig
    shortcutErrors: string[]
  }>
  testConnection: (
    input?: TestConnectionInput,
  ) => Promise<{ ok: boolean; message: string }>
  toggleOverlay: () => Promise<boolean>
  showOverlay: () => Promise<boolean>
  hideOverlay: () => Promise<boolean>
  showSettings: (section?: SettingsSection) => Promise<boolean>
  onSettingsOpenSection: (
    callback: (section: SettingsSection) => void,
  ) => () => void
  getOverlayPosition: () => Promise<OverlayWindowBounds>
  setOverlayPosition: (bounds: OverlayWindowBounds) => Promise<OverlayWindowBounds>
  moveOverlay: (
    x: number,
    y: number,
    options?: {
      panelSide?: 'left' | 'right'
      menuOpen?: boolean
      orbCenterOffset?: { x: number; y: number }
    },
  ) => Promise<OverlayWindowBounds>
  startOverlayDrag: (payload: {
    screenX: number
    screenY: number
    orbCenterOffset: { x: number; y: number }
    menuOpen?: boolean
  }) => Promise<boolean>
  endOverlayDrag: () => Promise<OverlayWindowBounds | null>
  resizeOverlay: (width: number, height: number) => Promise<OverlayWindowBounds>
  getOverlayCanvasSize: () => Promise<{ width: number; height: number }>
  setOverlayIgnoreMouseEvents: (ignore: boolean) => Promise<boolean>
  getOverlayDisplayLimits: () => Promise<{
    workAreaHeight: number
    maxWindowHeight: number
    workArea: { x: number; y: number; width: number; height: number }
  }>
  transcribe: (buffer: ArrayBuffer, mimeType: string) => Promise<string>
  sendChat: (messages: ChatMessage[]) => Promise<void>
  cancelChat: () => Promise<boolean>
  onChatStream: (callback: (chunk: ChatStreamChunk) => void) => () => void
  /** 显示悬浮窗并进入文字模式 */
  onOverlayFocusText: (callback: () => void) => () => void
  onOverlayHidden: (callback: () => void) => () => void
  /** 悬浮窗可见时：切换文字 / 语音 */
  onOverlayToggleInputMode: (callback: () => void) => () => void
  onPttStart: (callback: () => void) => () => void
  onPttStop: (callback: () => void) => () => void
  windowMinimize: () => Promise<void>
  windowClose: () => Promise<void>
  suspendGlobalShortcuts: () => Promise<void>
  resumeGlobalShortcuts: () => Promise<{ errors: string[] }>
  clearWhisperModelCache: () => Promise<void>
  notifyWhisperCacheChanged: (modelId?: string) => Promise<void>
  onSttCacheCleared: (
    callback: (payload: { modelId?: string }) => void,
  ) => () => void
  onConfigUpdated: (callback: (config: PublicConfig) => void) => () => void
  listChatSessions: () => Promise<ChatSessionSummary[]>
  getChatSession: (id: string) => Promise<ChatSession | null>
  saveChatSession: (payload: {
    id?: string
    messages: ChatMessage[]
  }) => Promise<ChatSession>
  deleteChatSession: (id: string) => Promise<boolean>
  clearChatSessions: () => Promise<void>
  onChatHistoryChanged: (callback: () => void) => () => void
}

const api: DesktopAgentApi = {
  getConfig: () => ipcRenderer.invoke(IPC.configGet),
  saveConfig: (config) => ipcRenderer.invoke(IPC.configSave, config),
  testConnection: (input) => ipcRenderer.invoke(IPC.configTest, input),
  toggleOverlay: () => ipcRenderer.invoke(IPC.overlayToggle),
  showOverlay: () => ipcRenderer.invoke(IPC.overlayShow),
  hideOverlay: () => ipcRenderer.invoke(IPC.overlayHide),
  showSettings: (section) =>
    ipcRenderer.invoke(IPC.overlayShowSettings, section),
  onSettingsOpenSection: (callback) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      section: SettingsSection,
    ) => callback(section)
    ipcRenderer.on(IPC.settingsOpenSection, handler)
    return () => ipcRenderer.removeListener(IPC.settingsOpenSection, handler)
  },
  getOverlayPosition: () => ipcRenderer.invoke(IPC.overlayGetPosition),
  setOverlayPosition: (bounds) =>
    ipcRenderer.invoke(IPC.overlaySetPosition, bounds),
  moveOverlay: (x, y, options) =>
    ipcRenderer.invoke(IPC.overlayMove, {
      x,
      y,
      panelSide: options?.panelSide,
      menuOpen: options?.menuOpen,
      orbCenterOffset: options?.orbCenterOffset,
    }),
  startOverlayDrag: (payload) =>
    ipcRenderer.invoke(IPC.overlayDragStart, payload),
  endOverlayDrag: () => ipcRenderer.invoke(IPC.overlayDragEnd),
  resizeOverlay: (width, height) =>
    ipcRenderer.invoke(IPC.overlayResize, { width, height }),
  getOverlayCanvasSize: () => ipcRenderer.invoke(IPC.overlayGetCanvasSize),
  setOverlayIgnoreMouseEvents: (ignore) =>
    ipcRenderer.invoke(IPC.overlaySetIgnoreMouseEvents, { ignore }),
  getOverlayDisplayLimits: () =>
    ipcRenderer.invoke(IPC.overlayGetDisplayLimits),
  transcribe: (buffer, mimeType) =>
    ipcRenderer.invoke(IPC.sttTranscribe, { buffer, mimeType }),
  sendChat: (messages) => ipcRenderer.invoke(IPC.chatSend, messages),
  cancelChat: () => ipcRenderer.invoke(IPC.chatCancel),
  onChatStream: (callback) => {
    const handler = (_: Electron.IpcRendererEvent, chunk: ChatStreamChunk) =>
      callback(chunk)
    ipcRenderer.on(IPC.chatStream, handler)
    return () => ipcRenderer.removeListener(IPC.chatStream, handler)
  },
  onOverlayFocusText: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('overlay:focus-text', handler)
    return () => ipcRenderer.removeListener('overlay:focus-text', handler)
  },
  onOverlayHidden: (callback) => {
    const handler = () => callback()
    ipcRenderer.on(IPC.overlayHidden, handler)
    return () => ipcRenderer.removeListener(IPC.overlayHidden, handler)
  },
  onOverlayToggleInputMode: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('overlay:toggle-input-mode', handler)
    return () =>
      ipcRenderer.removeListener('overlay:toggle-input-mode', handler)
  },
  onPttStart: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('ptt:start', handler)
    return () => ipcRenderer.removeListener('ptt:start', handler)
  },
  onPttStop: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('ptt:stop', handler)
    return () => ipcRenderer.removeListener('ptt:stop', handler)
  },
  windowMinimize: () => ipcRenderer.invoke(IPC.windowMinimize),
  windowClose: () => ipcRenderer.invoke(IPC.windowClose),
  suspendGlobalShortcuts: () => ipcRenderer.invoke(IPC.shortcutsSuspend),
  resumeGlobalShortcuts: () => ipcRenderer.invoke(IPC.shortcutsResume),
  clearWhisperModelCache: () => ipcRenderer.invoke(IPC.sttClearCache),
  notifyWhisperCacheChanged: (modelId) =>
    ipcRenderer.invoke(IPC.sttNotifyCacheChanged, { modelId }),
  onSttCacheCleared: (callback) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      payload: { modelId?: string },
    ) => callback(payload ?? {})
    ipcRenderer.on(IPC.sttCacheCleared, handler)
    return () => ipcRenderer.removeListener(IPC.sttCacheCleared, handler)
  },
  onConfigUpdated: (callback) => {
    const handler = (_: Electron.IpcRendererEvent, config: PublicConfig) =>
      callback(config)
    ipcRenderer.on(IPC.configUpdated, handler)
    return () => ipcRenderer.removeListener(IPC.configUpdated, handler)
  },
  listChatSessions: () => ipcRenderer.invoke(IPC.chatHistoryList),
  getChatSession: (id) => ipcRenderer.invoke(IPC.chatHistoryGet, id),
  saveChatSession: (payload) => ipcRenderer.invoke(IPC.chatHistorySave, payload),
  deleteChatSession: (id) => ipcRenderer.invoke(IPC.chatHistoryDelete, id),
  clearChatSessions: () => ipcRenderer.invoke(IPC.chatHistoryClear),
  onChatHistoryChanged: (callback) => {
    const handler = () => callback()
    ipcRenderer.on(IPC.chatHistoryChanged, handler)
    return () => ipcRenderer.removeListener(IPC.chatHistoryChanged, handler)
  },
}

contextBridge.exposeInMainWorld('desktopAgent', api)
