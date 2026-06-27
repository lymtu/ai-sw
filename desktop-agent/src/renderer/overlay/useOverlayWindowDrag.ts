import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { OverlayWindowBounds } from '../../shared/types'

const DRAG_THRESHOLD_PX = 5
const DRAG_HANDLE_SELECTOR = '.overlay-drag-handle'

type DragPlacement = {
  menuOpen: boolean
}

type LocalSession = {
  screenX: number
  screenY: number
  orbCenterOffset: { x: number; y: number }
  mainDrag: boolean
}

const lastOverlayWindowPos: OverlayWindowBounds = { x: 0, y: 0, width: 520, height: 400 }

export function primeOverlayWindowPosition(bounds: OverlayWindowBounds): void {
  lastOverlayWindowPos.x = bounds.x
  lastOverlayWindowPos.y = bounds.y
  lastOverlayWindowPos.width = bounds.width
  lastOverlayWindowPos.height = bounds.height
}

function dragHandleFromTarget(
  root: HTMLElement,
  target: EventTarget | null,
): HTMLElement | null {
  if (!(target instanceof Element)) return null
  const handle = target.closest<HTMLElement>(DRAG_HANDLE_SELECTOR)
  if (!handle || !root.contains(handle)) return null
  return handle
}

/**
 * 中间球/叉号：左键点击/拖拽、右键环形菜单。
 * 捕获阶段挂在 window，避免透明壳层 pointer-events 影响委托。
 */
export function useOverlayWindowDrag(
  shellRef: RefObject<HTMLElement | null>,
  onTap?: () => void,
  onDragEnd?: () => void,
  onContextMenu?: () => void,
  placement?: DragPlacement | null,
) {
  const placementRef = useRef(placement)
  placementRef.current = placement
  const onTapRef = useRef(onTap)
  const onDragEndRef = useRef(onDragEnd)
  const onContextMenuRef = useRef(onContextMenu)
  onTapRef.current = onTap
  onDragEndRef.current = onDragEnd
  onContextMenuRef.current = onContextMenu

  useLayoutEffect(() => {
    void window.desktopAgent.getOverlayPosition().then(primeOverlayWindowPosition)
    void window.desktopAgent.setOverlayIgnoreMouseEvents(false)
  }, [])

  useLayoutEffect(() => {
    const root = shellRef.current
    if (!root) return

    let session: LocalSession | null = null
    let didMove = false
    let suppressTapUntil = 0

    const finishDrag = async (wasTap: boolean, didDrag: boolean) => {
      if (session?.mainDrag) {
        const bounds = await window.desktopAgent.endOverlayDrag()
        if (bounds) primeOverlayWindowPosition(bounds)
      }
      session = null
      didMove = false
      document.body.classList.remove('overlay-window-dragging')
      window.dispatchEvent(new Event('overlay-drag-end'))
      if (wasTap) onTapRef.current?.()
      else if (didDrag) onDragEndRef.current?.()
    }

    const triggerContextMenu = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      suppressTapUntil = Date.now() + 400
      onContextMenuRef.current?.()
    }

    const onPointerDown = (e: PointerEvent) => {
      const handle = dragHandleFromTarget(root, e.target)
      if (!handle) return

      if (e.button === 2) {
        triggerContextMenu(e)
        return
      }

      if (e.button !== 0) return

      didMove = false
      const rect = handle.getBoundingClientRect()
      session = {
        screenX: e.screenX,
        screenY: e.screenY,
        orbCenterOffset: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        },
        mainDrag: false,
      }
      document.body.classList.add('overlay-window-dragging')
      window.dispatchEvent(new Event('overlay-drag-start'))
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!session || session.mainDrag) return
      const dx = e.screenX - session.screenX
      const dy = e.screenY - session.screenY
      if (!didMove && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
        didMove = true
        session.mainDrag = true
        void window.desktopAgent.startOverlayDrag({
          screenX: session.screenX,
          screenY: session.screenY,
          orbCenterOffset: session.orbCenterOffset,
          menuOpen: placementRef.current?.menuOpen ?? false,
        })
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return

      if (Date.now() < suppressTapUntil) {
        session = null
        didMove = false
        document.body.classList.remove('overlay-window-dragging')
        return
      }

      if (!session) return
      const wasTap = !didMove
      const dragged = didMove
      void finishDrag(wasTap, dragged)
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      const handle = dragHandleFromTarget(root, e.target)
      if (!handle) return
      if (Date.now() < suppressTapUntil) return
      triggerContextMenu(e)
    }

    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('contextmenu', onContextMenu, true)

    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('contextmenu', onContextMenu, true)
      if (session?.mainDrag) {
        void window.desktopAgent.endOverlayDrag()
      }
      session = null
      document.body.classList.remove('overlay-window-dragging')
    }
  }, [shellRef])
}
