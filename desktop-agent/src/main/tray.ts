import { app, Menu, Tray } from 'electron'
import { getTrayIcon } from './icons'
import { toggleOverlay, toggleSettingsWindow } from './windows'

let tray: Tray | null = null

export function createTray(): Tray {
  if (tray) return tray

  const icon = getTrayIcon()
  if (icon.isEmpty()) {
    throw new Error(
      '托盘图标缺失，请在 desktop-agent 目录运行: node scripts/generate-icons.mjs',
    )
  }

  tray = new Tray(icon)
  tray.setToolTip('Desktop Agent')

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示输入框', click: () => toggleOverlay() },
    { label: '打开设置', click: () => toggleSettingsWindow() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => toggleSettingsWindow())

  return tray
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}
