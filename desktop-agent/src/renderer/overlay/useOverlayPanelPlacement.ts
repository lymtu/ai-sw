import { useCallback, useRef, useState, type RefObject } from 'react'
import {
  OVERLAY_LAYOUT,
  overlayExpandedCanvasWidth,
  resolveOverlayPanelSideFromAnchor,
  type OverlayPanelSide,
  type OverlayViewMode,
} from '../../shared/overlay-layout'

type SyncOptions = {
  /** false：收起态拖动只记 ref，展开后再应用布局 */
  layout?: boolean
}

export function useOverlayPanelPlacement(
  orbRef: RefObject<HTMLElement | null>,
  canvasSize: { width: number; height: number } | null,
  getViewMode: () => OverlayViewMode,
) {
  const [panelSide, setPanelSide] = useState<OverlayPanelSide>('right')
  const panelSideRef = useRef<OverlayPanelSide>('right')

  const syncPanelSideFromScreen = useCallback(
    async (screenCx: number, options?: SyncOptions): Promise<OverlayPanelSide> => {
      const limits = await window.desktopAgent.getOverlayDisplayLimits()
      const orbLeft = screenCx - OVERLAY_LAYOUT.orbSize / 2
      const expandedW = overlayExpandedCanvasWidth()
      const side = resolveOverlayPanelSideFromAnchor(
        orbLeft,
        expandedW,
        limits.workArea,
      )
      panelSideRef.current = side
      if (options?.layout !== false) {
        setPanelSide(side)
      }
      return side
    },
    [],
  )

  const captureOrbScreenCenter = useCallback(async (): Promise<{
    cx: number
    cy: number
  } | null> => {
    const orb = orbRef.current
    if (!orb) return null
    const win = await window.desktopAgent.getOverlayPosition()
    const rect = orb.getBoundingClientRect()
    return {
      cx: Math.round(win.x + rect.left + rect.width / 2),
      cy: Math.round(win.y + rect.top + rect.height / 2),
    }
  }, [orbRef])

  const onDragEnd = useCallback(async () => {
    const orb = orbRef.current
    if (!orb) return
    const win = await window.desktopAgent.getOverlayPosition()
    const rect = orb.getBoundingClientRect()
    const screenCx = Math.round(win.x + rect.left + rect.width / 2)
    const collapsed = getViewMode() === 'collapsed'
    await syncPanelSideFromScreen(screenCx, { layout: !collapsed })
  }, [orbRef, getViewMode, syncPanelSideFromScreen])

  const applyPanelSideFromRef = useCallback(() => {
    setPanelSide(panelSideRef.current)
  }, [])

  return {
    panelSide,
    panelSideRef,
    onDragEnd,
    captureOrbScreenCenter,
    syncPanelSideFromScreen,
    applyPanelSideFromRef,
  }
}
