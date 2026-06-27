import { app, BrowserWindow } from 'electron'
import { applyLoginItemSettings, getPublicConfig } from './config'
import { registerIpcHandlers } from './ipc'
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './shortcuts'
import { createTray, destroyTray } from './tray'
import { createOverlayWindow, showOverlay, showSettingsWindow } from './windows'

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showSettingsWindow()
  })

  app.whenReady().then(() => {
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.ai-project.desktop-agent')
    }

    if (process.platform === 'darwin') {
      app.dock?.hide()
    }

    registerIpcHandlers()

    const config = getPublicConfig()
    applyLoginItemSettings(config.launchAtLogin)

    createTray()
    createOverlayWindow()
    showOverlay()

    const { errors } = registerGlobalShortcuts()
    if (errors.length > 0) {
      console.warn('Shortcut registration errors:', errors)
    }
  })

  app.on('window-all-closed', () => {
    // Tray app: keep process alive
  })

  app.on('before-quit', () => {
    unregisterGlobalShortcuts()
    destroyTray()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      showSettingsWindow()
    }
  })
}
