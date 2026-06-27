import type { RefObject } from 'react'
import { cn } from '@renderer/shared/cn'
import { OverlayOrb } from './OverlayOrb'
import {
  OverlayRadialMenu,
  type RadialMenuAction,
} from './OverlayRadialMenu'

type Props = {
  showRadialMenu: boolean
  menuOpen: boolean
  active: boolean
  recording: boolean
  animating: boolean
  orbRef: RefObject<HTMLButtonElement | null>
  onAction: (action: RadialMenuAction) => void
}

export function OverlayOrbCluster({
  showRadialMenu,
  menuOpen,
  active,
  recording,
  animating,
  orbRef,
  onAction,
}: Props) {
  if (showRadialMenu) {
    return (
      <OverlayRadialMenu
        open={menuOpen}
        orbRef={orbRef}
        active={false}
        recording={recording}
        animating={animating}
        onAction={onAction}
      />
    )
  }

  return (
    <button
      ref={orbRef}
      type="button"
      className={cn(
        'overlay-drag-handle app-no-drag app-interactive size-12 shrink-0 rounded-full border-0 bg-transparent p-0',
        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40',
      )}
      aria-label="悬浮球"
      title="左键收起，右键菜单，按住拖动"
    >
      <OverlayOrb active={active} recording={recording} animating={animating} />
    </button>
  )
}
