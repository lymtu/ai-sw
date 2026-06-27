import { screen, type BrowserWindow } from 'electron'
import {
  clampOverlayWindowOrigin,
  clampOverlayWindowOriginByOrbOffset,
  overlayCanvasHeight,
  overlayExpandedCanvasWidth,
  overlayMaxWindowHeight,
  type OverlayDisplayLimits,
  type OverlayPanelSide,
} from '../shared/overlay-layout'
import type { OverlayWindowBounds } from '../shared/types'

let overlayCanvasDimensions: { width: number; height: number } | null = null

export function resolveOverlayCanvasDimensions(
  workAreaHeight: number,
): { width: number; height: number } {
  overlayCanvasDimensions = {
    width: overlayExpandedCanvasWidth(),
    height: overlayCanvasHeight(workAreaHeight),
  }
  return overlayCanvasDimensions
}

export function setOverlayCanvasDimensions(patch: {
  width?: number
  height?: number
}): { width: number; height: number } {
  const cur = getOverlayCanvasDimensions()
  overlayCanvasDimensions = {
    width: patch.width ?? cur.width,
    height: patch.height ?? cur.height,
  }
  return overlayCanvasDimensions
}

export function getOverlayCanvasDimensions(): {
  width: number
  height: number
} {
  if (overlayCanvasDimensions) return overlayCanvasDimensions
  const workArea = screen.getPrimaryDisplay().workArea
  return resolveOverlayCanvasDimensions(workArea.height)
}

export function applyOverlayIgnoreMouse(
  win: BrowserWindow,
  ignore: boolean,
  opaqueOverlay: boolean,
): void {
  if (opaqueOverlay) {
    win.setIgnoreMouseEvents(false)
    return
  }
  if (ignore) {
    win.setIgnoreMouseEvents(true, { forward: true })
  } else {
    win.setIgnoreMouseEvents(false)
  }
}

export function getOverlayDisplayLimits(
  win: BrowserWindow,
): OverlayDisplayLimits {
  const { x, y, width, height } = win.getBounds()
  const display = screen.getDisplayMatching({ x, y, width, height })
  const workArea = display.workArea
  return {
    workAreaHeight: workArea.height,
    maxWindowHeight: overlayMaxWindowHeight(workArea.height),
    workArea: {
      x: workArea.x,
      y: workArea.y,
      width: workArea.width,
      height: workArea.height,
    },
  }
}

export function clampOverlayBounds(
  win: BrowserWindow,
  x: number,
  y: number,
  width: number,
  height: number,
): OverlayWindowBounds {
  const display = screen.getDisplayMatching({ x, y, width, height })
  const area = display.workArea
  const w = Math.min(Math.max(1, Math.round(width)), area.width)
  const h = Math.min(Math.max(1, Math.round(height)), area.height)
  const clampedX = Math.round(
    Math.max(area.x, Math.min(x, area.x + area.width - w)),
  )
  const clampedY = Math.round(
    Math.max(area.y, Math.min(y, area.y + area.height - h)),
  )
  return { x: clampedX, y: clampedY, width: w, height: h }
}

export function clampOverlayResize(
  win: BrowserWindow,
  x: number,
  y: number,
  width: number,
  height: number,
): OverlayWindowBounds {
  const display = screen.getDisplayMatching(win.getBounds())
  const area = display.workArea
  const w = Math.min(Math.max(1, Math.round(width)), area.width)
  const fixedY = Math.max(area.y, Math.round(y))
  const availableHeight = Math.max(1, area.y + area.height - fixedY)
  const h = Math.min(Math.max(1, Math.round(height)), availableHeight)
  return { x: Math.round(x), y: fixedY, width: w, height: h }
}

/** 改高度时固定窗口底边，避免工具行/悬浮球在屏幕上乱跳 */
export function resizeOverlayBottomAnchored(
  win: BrowserWindow,
  targetWidth: number,
  targetHeight: number,
): OverlayWindowBounds {
  const { x, y, width, height } = win.getBounds()
  const w = Math.round(targetWidth)
  const h = Math.round(targetHeight)
  const newY = Math.round(y + height - h)
  return clampOverlayResize(win, x, newY, w, h)
}

export type OverlayMoveOptions = {
  panelSide?: OverlayPanelSide
  menuOpen?: boolean
  /** 球心相对窗口客户区左上角的偏移（拖动时由 renderer 实测） */
  orbCenterOffset?: { x: number; y: number }
}

/** 拖动时只移动窗口，按球心贴边（非整窗 clamp） */
export function clampOverlayMove(
  win: BrowserWindow,
  x: number,
  y: number,
  options: OverlayMoveOptions,
): OverlayWindowBounds {
  const { x: winX0, y: winY0, width, height } = win.getBounds()
  setOverlayCanvasDimensions({ width, height })
  const canvas = getOverlayCanvasDimensions()
  const display = screen.getDisplayMatching({ x: winX0, y: winY0, width, height })
  const area = display.workArea
  const menuOpen = options.menuOpen ?? false

  const origin = options.orbCenterOffset
    ? clampOverlayWindowOriginByOrbOffset(
        x,
        y,
        options.orbCenterOffset.x,
        options.orbCenterOffset.y,
        area,
        menuOpen,
        canvas.width,
        canvas.height,
      )
    : clampOverlayWindowOrigin(
        x,
        y,
        options.panelSide ?? 'right',
        canvas.height,
        area,
        menuOpen,
        canvas.width,
      )

  return { x: origin.x, y: origin.y, width: canvas.width, height: canvas.height }
}
