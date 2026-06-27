import { globalShortcut } from 'electron'
import { getPublicConfig } from './config'
import { isOverlayVisible, sendToOverlay, showOverlay, toggleOverlay } from './windows'

let pttActive = false
let suspendCount = 0

export function suspendGlobalShortcuts(): void {
  suspendCount += 1
  if (suspendCount === 1) {
    unregisterGlobalShortcuts()
  }
}

export function resumeGlobalShortcuts(): { errors: string[] } {
  suspendCount = Math.max(0, suspendCount - 1)
  if (suspendCount === 0) {
    return registerGlobalShortcuts()
  }
  return { errors: [] }
}

export function registerGlobalShortcuts(): { errors: string[] } {
  if (suspendCount > 0) {
    return { errors: [] }
  }
  unregisterGlobalShortcuts()
  const errors: string[] = []
  const { hotkeyToggleOverlay, hotkeyPushToTalk, hotkeyToggleInputMode } =
    getPublicConfig()

  if (
    !globalShortcut.register(hotkeyToggleOverlay, () => {
      toggleOverlay()
    })
  ) {
    errors.push(`无法注册快捷键: ${hotkeyToggleOverlay}`)
  }

  // Electron globalShortcut only fires on press (no keyup).
  // PTT: first press shows overlay + voice mode + record; second press stops.
  if (
    !globalShortcut.register(hotkeyPushToTalk, () => {
      if (!pttActive) {
        pttActive = true
        showOverlay({ focusText: false })
        sendToOverlay('ptt:start')
      } else {
        pttActive = false
        sendToOverlay('ptt:stop')
      }
    })
  ) {
    errors.push(`无法注册快捷键: ${hotkeyPushToTalk}`)
  }

  if (
    !globalShortcut.register(hotkeyToggleInputMode, () => {
      if (!isOverlayVisible()) return
      sendToOverlay('overlay:toggle-input-mode')
    })
  ) {
    errors.push(`无法注册快捷键: ${hotkeyToggleInputMode}`)
  }

  return { errors }
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
  pttActive = false
}
