import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { getPublicConfig } from './config'
import { getAppIcon } from './icons'
import {
  applyOverlayIgnoreMouse,
  resolveOverlayCanvasDimensions,
} from './overlay-bounds'
import {
  OVERLAY_LAYOUT,
  clampOverlayWindowOrigin,
  overlayOrbAnchorInCanvas,
} from '../shared/overlay-layout'
import { IPC } from '../shared/types'

let settingsWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null

function getRendererUrl(name: 'settings' | 'overlay'): string {
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    const base = devUrl.replace(/\/$/, '')
    return `${base}/${name}.html`
  }
  return join(__dirname, `../renderer/${name}.html`)
}

export function createSettingsWindow(): BrowserWindow {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    return settingsWindow
  }

  settingsWindow = new BrowserWindow({
    width: 720,
    height: 560,
    minWidth: 560,
    minHeight: 420,
    show: false,
    frame: false,
    thickFrame: process.platform === 'win32',
    autoHideMenuBar: true,
    title: 'Desktop Agent 设置',
    icon: getAppIcon(),
    backgroundColor: '#f5f6f8',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  const url = getRendererUrl('settings')
  if (url.startsWith('http')) {
    settingsWindow.loadURL(url)
  } else {
    settingsWindow.loadFile(url)
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  settingsWindow.on('ready-to-show', () => {
    settingsWindow?.show()
    settingsWindow?.focus()
  })

  return settingsWindow
}

export function getSettingsWindow(): BrowserWindow | null {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    return settingsWindow
  }
  return null
}

export type ShowSettingsOptions = {
  /** 从悬浮窗打开：设置窗不抢焦点，便于继续拖球 */
  keepOverlayFocused?: boolean
}

function placeSettingsBesideOverlay(
  settings: BrowserWindow,
  overlay: BrowserWindow,
): void {
  const ob = overlay.getBounds()
  const sw = settings.getBounds().width
  const display = screen.getDisplayMatching(ob)
  const area = display.workArea
  let sx = ob.x - sw - 16
  if (sx < area.x) {
    sx = Math.min(ob.x + ob.width + 16, area.x + area.width - sw)
  }
  const sy = Math.max(
    area.y,
    Math.min(ob.y, area.y + area.height - settings.getBounds().height),
  )
  settings.setPosition(Math.round(sx), Math.round(sy))
}

export function showSettingsWindow(
  section?: string,
  options?: ShowSettingsOptions,
): void {
  const win = createSettingsWindow()
  const overlay = getOverlayWindow()
  const keepOverlay = options?.keepOverlayFocused === true

  if (keepOverlay && overlay && !overlay.isDestroyed()) {
    placeSettingsBesideOverlay(win, overlay)
  }

  if (!win.isVisible()) {
    if (keepOverlay) win.showInactive()
    else win.show()
  }

  if (keepOverlay) {
    if (overlay?.isVisible() && !overlay.isDestroyed()) {
      overlay.moveTop()
      overlay.focus()
    }
  } else {
    win.focus()
  }

  if (section) {
    const send = () => win.webContents.send(IPC.settingsOpenSection, section)
    if (win.webContents.isLoading()) {
      win.webContents.once('did-finish-load', send)
    } else {
      send()
    }
  }
}

/** 左键托盘：已显示则隐藏，否则显示并聚焦 */
export function toggleSettingsWindow(): boolean {
  const win = createSettingsWindow()
  if (win.isVisible()) {
    win.hide()
    return false
  }
  win.show()
  win.focus()
  return true
}

export function createOverlayWindow(): BrowserWindow {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    return overlayWindow
  }

  const { opaqueOverlay } = getPublicConfig()
  const display = screen.getPrimaryDisplay()
  const workArea = display.workArea
  const { width: canvasW, height: canvasH } = resolveOverlayCanvasDimensions(
    workArea.height,
  )

  const panelSide = 'right' as const
  const { cx, cy } = overlayOrbAnchorInCanvas(canvasH, canvasW)
  const screenCx = workArea.x + workArea.width / 2
  const screenCy = workArea.y + workArea.height - OVERLAY_LAYOUT.shellHorizontalPadding
  const initialOrigin = clampOverlayWindowOrigin(
    Math.round(screenCx - cx),
    Math.round(screenCy - cy),
    panelSide,
    canvasH,
    workArea,
    false,
    canvasW,
  )

  overlayWindow = new BrowserWindow({
    width: canvasW,
    height: canvasH,
    x: initialOrigin.x,
    y: initialOrigin.y,
    frame: false,
    transparent: !opaqueOverlay,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    focusable: true,
    hasShadow: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  const url = getRendererUrl('overlay')
  if (url.startsWith('http')) {
    overlayWindow.loadURL(url)
  } else {
    overlayWindow.loadFile(url)
  }

  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  overlayWindow.webContents.on('context-menu', (event) => {
    event.preventDefault()
  })

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })

  overlayWindow.on('ready-to-show', () => {
    if (overlayWindow) {
      // 透明窗用 CSS pointer-events 做穿透；ignore=true 时 Windows 左键/拖拽进不了渲染进程
      applyOverlayIgnoreMouse(overlayWindow, false, opaqueOverlay)
    }
    overlayWindow?.show()
    overlayWindow?.focus()
    overlayWindow?.webContents.send('overlay:focus-text')
  })

  return overlayWindow
}

export function getOverlayWindow(): BrowserWindow | null {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    return overlayWindow
  }
  return null
}

export function isOverlayVisible(): boolean {
  const win = getOverlayWindow()
  return Boolean(win?.isVisible())
}

export function toggleOverlay(): boolean {
  const win = getOverlayWindow() ?? createOverlayWindow()
  if (win.isVisible()) {
    win.webContents.send('overlay:hidden')
    win.hide()
    return false
  }
  win.show()
  win.focus()
  win.webContents.send('overlay:focus-text')
  return true
}

export type OverlayShowOptions = {
  /** 显示后是否聚焦文字输入；PTT 等场景传 false */
  focusText?: boolean
}

export function showOverlay(options?: OverlayShowOptions): void {
  const win = getOverlayWindow() ?? createOverlayWindow()
  win.show()
  win.focus()
  if (options?.focusText !== false) {
    win.webContents.send('overlay:focus-text')
  }
}

export function hideOverlay(): void {
  const win = getOverlayWindow()
  if (!win) return
  win.webContents.send('overlay:hidden')
  win.hide()
}

export function sendToOverlay(channel: string, ...args: unknown[]): void {
  const win = getOverlayWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args)
  }
}
