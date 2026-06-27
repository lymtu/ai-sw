import { IconHide, IconMinimize } from '@renderer/shared/icons/Icon'

export function SettingsTitleBar() {
  return (
    <header className="app-drag flex h-11 shrink-0 items-center border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 pl-1">
        <span className="truncate text-sm font-medium text-[var(--color-text)]">
          Desktop Agent
        </span>
        <span className="truncate text-xs text-[var(--color-muted)]">设置</span>
      </div>
      <div className="app-no-drag flex items-center">
        <button
          type="button"
          onClick={() => void window.desktopAgent.windowMinimize()}
          className="flex size-9 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
          aria-label="最小化"
        >
          <IconMinimize />
        </button>
        <button
          type="button"
          onClick={() => void window.desktopAgent.windowClose()}
          className="group flex size-9 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-danger)] hover:text-white"
          aria-label="关闭"
        >
          <IconHide className="size-4 text-current" />
        </button>
      </div>
    </header>
  )
}
