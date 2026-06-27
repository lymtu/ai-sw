import type { ComponentType, RefObject } from 'react'
import {
  OVERLAY_LAYOUT,
  overlayRadialMenuLayout,
  type RadialMenuActionId,
} from '../../shared/overlay-layout'
import { cn } from '@renderer/shared/cn'
import {
  IconClose,
  IconHistory,
  IconKeyboard,
  IconMic,
  IconNewChat,
  IconSliders,
  IconTheme,
} from '@renderer/shared/icons/Icon'
import { OverlayOrb } from './OverlayOrb'

export type RadialMenuAction = RadialMenuActionId

const ICONS: Record<
  RadialMenuActionId,
  { label: string; Icon: ComponentType<{ className?: string }> }
> = {
  text: { label: '文字聊天', Icon: IconKeyboard },
  voice: { label: '语音输入', Icon: IconMic },
  settings: { label: '设置', Icon: IconSliders },
  theme: { label: '主题切换', Icon: IconTheme },
  history: { label: '历史记录', Icon: IconHistory },
  'new-chat': { label: '新建会话', Icon: IconNewChat },
}

const MENU_LAYOUT = overlayRadialMenuLayout()
const SAT = OVERLAY_LAYOUT.radialSatelliteSize
const CENTER = OVERLAY_LAYOUT.orbSize

type OverlayRadialMenuProps = {
  open: boolean
  orbRef: RefObject<HTMLButtonElement | null>
  active?: boolean
  recording?: boolean
  animating?: boolean
  onAction: (action: RadialMenuAction) => void
}

export function OverlayRadialMenu({
  open,
  orbRef,
  active,
  recording,
  animating,
  onAction,
}: OverlayRadialMenuProps) {
  return (
    <div
      className="overlay-radial-menu relative flex items-center justify-center"
      style={{ width: MENU_LAYOUT.width, height: MENU_LAYOUT.height }}
    >
      {MENU_LAYOUT.items.map((item) => {
        const meta = ICONS[item.id]
        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              'overlay-radial-satellite app-no-drag app-interactive absolute z-0 flex items-center justify-center rounded-full',
              'border border-[var(--color-border)] shadow-md transition-all duration-200',
              'hover:scale-105 active:scale-95',
              open
                ? 'scale-100 opacity-100'
                : 'pointer-events-none scale-0 opacity-0',
            )}
            style={{
              width: SAT,
              height: SAT,
              left: `calc(50% + ${item.x}px - ${SAT / 2}px)`,
              top: `calc(50% + ${item.y}px - ${SAT / 2}px)`,
            }}
            title={meta.label}
            aria-label={meta.label}
            tabIndex={open ? 0 : -1}
            onClick={() => onAction(item.id)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <meta.Icon className="size-5" />
          </button>
        )
      })}

      <button
        ref={orbRef}
        type="button"
        className={cn(
          'overlay-drag-handle app-no-drag app-interactive relative z-10 flex shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0',
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40',
        )}
        style={{ width: CENTER, height: CENTER }}
        aria-label={open ? '关闭菜单' : '悬浮球'}
        aria-expanded={open}
        aria-haspopup="menu"
        title={
          open
            ? '左键关闭菜单，按住拖动'
            : '左键展开输入，右键菜单，按住拖动'
        }
      >
        {open ? (
          <span
            className={cn(
              'overlay-orb-close flex items-center justify-center rounded-full',
              'border border-[var(--color-border)] bg-[var(--color-surface-elevated)]',
              'text-[var(--color-text)] shadow-md',
            )}
            style={{ width: CENTER, height: CENTER }}
          >
            <IconClose className="size-6" />
          </span>
        ) : (
          <OverlayOrb active={active} recording={recording} animating={animating} />
        )}
      </button>
    </div>
  )
}
