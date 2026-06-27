import { useEffect, useRef, type RefObject } from 'react'

/**
 * 透明 Overlay：默认让窗口忽略鼠标；鼠标移动到真实交互区时再恢复点击。
 * Electron 的 `{ forward: true }` 会继续转发 mousemove，便于从透明区重新唤醒。
 */
export function useOverlayMousePassThrough(
  shellRef: RefObject<HTMLElement | null>,
  opaqueOverlay: boolean,
) {
  const ignoreRef = useRef<boolean | null>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (opaqueOverlay) {
      ignoreRef.current = false
      void window.desktopAgent.setOverlayIgnoreMouseEvents(false)
      return
    }

    const setIgnore = (ignore: boolean) => {
      if (ignoreRef.current === ignore) return
      ignoreRef.current = ignore
      void window.desktopAgent.setOverlayIgnoreMouseEvents(ignore)
    }

    const isInteractivePoint = (clientX: number, clientY: number) => {
      const root = shellRef.current
      if (!root) return false
      const interactiveRects = root.querySelectorAll<HTMLElement>(
        '.overlay-hit-target, .app-interactive, .overlay-drag-handle',
      )
      for (const el of Array.from(interactiveRects)) {
        const rect = el.getBoundingClientRect()
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          return true
        }
      }
      return document.elementsFromPoint(clientX, clientY).some((el) => {
        if (!(el instanceof Element) || !root.contains(el)) return false
        return Boolean(
          el.closest(
            '.overlay-hit-target, .app-interactive, .overlay-drag-handle',
          ),
        )
      })
    }

    const refreshFromMouse = (event: MouseEvent) => {
      lastPointRef.current = { x: event.clientX, y: event.clientY }
      setIgnore(!isInteractivePoint(event.clientX, event.clientY))
    }

    const forceInteractive = () => setIgnore(false)
    const refreshAfterDrag = () => {
      window.setTimeout(() => {
        const point = lastPointRef.current
        if (!point) {
          setIgnore(true)
          return
        }
        setIgnore(!isInteractivePoint(point.x, point.y))
      }, 0)
    }
    const ignoreOnBlur = () => setIgnore(true)

    setIgnore(true)
    window.addEventListener('mousemove', refreshFromMouse, true)
    window.addEventListener('mousedown', refreshFromMouse, true)
    window.addEventListener('pointermove', refreshFromMouse, true)
    window.addEventListener('pointerdown', refreshFromMouse, true)
    window.addEventListener('overlay-drag-start', forceInteractive)
    window.addEventListener('overlay-drag-end', refreshAfterDrag)
    window.addEventListener('blur', ignoreOnBlur)

    return () => {
      window.removeEventListener('mousemove', refreshFromMouse, true)
      window.removeEventListener('mousedown', refreshFromMouse, true)
      window.removeEventListener('pointermove', refreshFromMouse, true)
      window.removeEventListener('pointerdown', refreshFromMouse, true)
      window.removeEventListener('overlay-drag-start', forceInteractive)
      window.removeEventListener('overlay-drag-end', refreshAfterDrag)
      window.removeEventListener('blur', ignoreOnBlur)
      setIgnore(false)
    }
  }, [shellRef, opaqueOverlay])
}
