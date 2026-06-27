import {
  IconApi,
  IconHistory,
  IconInfo,
  IconKeyboard,
  IconMic,
  IconNewChat,
  IconPrompt,
  IconSliders,
} from '@renderer/shared/icons/Icon'
import { cn } from '@renderer/shared/cn'
import type { SettingsSection } from '../../shared/types'

export type SettingsNavId = SettingsSection

const NAV_ITEMS: {
  id: SettingsNavId
  label: string
  Icon: typeof IconApi
}[] = [
  { id: 'general', label: '通用', Icon: IconSliders },
  { id: 'chat', label: '对话', Icon: IconNewChat },
  { id: 'history', label: '会话历史', Icon: IconHistory },
  { id: 'providers', label: '供应商', Icon: IconApi },
  { id: 'stt', label: '语音转写', Icon: IconMic },
  { id: 'prompt', label: '提示词', Icon: IconPrompt },
  { id: 'shortcuts', label: '快捷键', Icon: IconKeyboard },
  { id: 'about', label: '关于', Icon: IconInfo },
]

type Props = {
  active: SettingsNavId
  onChange: (id: SettingsNavId) => void
}

export function SettingsSidebar({ active, onChange }: Props) {
  return (
    <nav
      className="custom-scrollbar custom-scrollbar-y flex h-full min-h-0 w-44 shrink-0 flex-col gap-0.5 border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60 px-2 py-3"
      aria-label="设置导航"
    >
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
              isActive
                ? 'bg-[var(--color-accent)]/12 font-medium text-[var(--color-accent)]'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className={isActive ? 'text-[var(--color-accent)]' : undefined} />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
