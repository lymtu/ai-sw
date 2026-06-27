import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import {
  overlayConversationMaxHeightInCanvas,
  type OverlayViewMode,
} from '../../shared/overlay-layout'

export type OverlayViewSizeMeasure = {
  chromeRowRef: RefObject<HTMLElement | null>
  messagesRef: RefObject<HTMLElement | null>
  contentVersion: string
}

const MEASURE_DEBOUNCE_MS = 120

function measureConversationPanelHeight(
  messagesRef: RefObject<HTMLElement | null>,
): number {
  const messagesEl = messagesRef.current
  if (!messagesEl) return 0
  const root = messagesEl.closest('.overlay-conversation')
  if (root instanceof HTMLElement) {
    return root.scrollHeight
  }
  return messagesEl.scrollHeight
}

/**
 * 窗体创建时固定为半屏高 + 固定宽，运行期不再 resize。
 * 仅根据内容是否在半屏内溢出，切换对话区内部滚动（clamped）。
 */
export function useOverlayViewSize(
  viewMode: OverlayViewMode,
  canvasSize: { width: number; height: number } | null,
  measure: OverlayViewSizeMeasure,
): {
  conversationClamped: boolean
  panelMaxCap: number | null
} {
  const [conversationClamped, setConversationClamped] = useState(false)
  const measureTimerRef = useRef<number | null>(null)
  const lastClampedRef = useRef(false)

  const panelMaxCap = useMemo(() => {
    if (!canvasSize || viewMode === 'collapsed') return null
    return overlayConversationMaxHeightInCanvas(canvasSize.height)
  }, [canvasSize, viewMode])

  useEffect(() => {
    if (viewMode !== 'conversation' || panelMaxCap == null) {
      if (lastClampedRef.current) {
        lastClampedRef.current = false
        setConversationClamped(false)
      }
      return
    }

    let cancelled = false

    const run = () => {
      const panelH = measureConversationPanelHeight(measure.messagesRef)
      const clamped = panelH > panelMaxCap
      if (cancelled || clamped === lastClampedRef.current) return
      lastClampedRef.current = clamped
      setConversationClamped(clamped)
    }

    const schedule = () => {
      if (measureTimerRef.current != null) {
        window.clearTimeout(measureTimerRef.current)
      }
      measureTimerRef.current = window.setTimeout(() => {
        measureTimerRef.current = null
        run()
      }, MEASURE_DEBOUNCE_MS)
    }

    schedule()

    const root = measure.messagesRef.current
    const observer =
      root && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => schedule())
        : null
    observer?.observe(root)

    return () => {
      cancelled = true
      observer?.disconnect()
      if (measureTimerRef.current != null) {
        window.clearTimeout(measureTimerRef.current)
        measureTimerRef.current = null
      }
    }
  }, [viewMode, panelMaxCap, measure.contentVersion, measure.messagesRef])

  return { conversationClamped, panelMaxCap }
}
