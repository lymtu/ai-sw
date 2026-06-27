import { screen, type BrowserWindow } from 'electron'
import { clampOverlayMove } from './overlay-bounds'

export type OverlayDragStartPayload = {
  screenX: number
  screenY: number
  orbCenterOffset: { x: number; y: number }
  menuOpen?: boolean
}

type DragSession = OverlayDragStartPayload & {
  win: BrowserWindow
  originWin: { x: number; y: number }
}

let session: DragSession | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null

function stopPoll() {
  if (pollTimer != null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function pollDrag() {
  if (!session) return
  const { win, screenX, screenY, originWin, orbCenterOffset, menuOpen } =
    session
  if (win.isDestroyed()) {
    endOverlayDrag()
    return
  }
  const pt = screen.getCursorScreenPoint()
  const rawX = originWin.x + (pt.x - screenX)
  const rawY = originWin.y + (pt.y - screenY)
  const next = clampOverlayMove(win, rawX, rawY, {
    orbCenterOffset,
    menuOpen: menuOpen ?? false,
  })
  win.setPosition(next.x, next.y)
}

export function startOverlayDrag(
  win: BrowserWindow,
  payload: OverlayDragStartPayload,
): void {
  endOverlayDrag()
  const { x, y } = win.getBounds()
  session = {
    win,
    originWin: { x, y },
    ...payload,
  }
  stopPoll()
  pollTimer = setInterval(pollDrag, 10)
}

export function endOverlayDrag(): { x: number; y: number; width: number; height: number } | null {
  stopPoll()
  if (!session) return null
  const win = session.win
  session = null
  if (win.isDestroyed()) return null
  const b = win.getBounds()
  return { x: b.x, y: b.y, width: b.width, height: b.height }
}

export function isOverlayDragActive(): boolean {
  return session != null
}
