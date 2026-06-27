import type { ThemeMode } from '../../shared/types'
import { cn } from '@renderer/shared/cn'
import type { SettingsPanelProps } from './types'

const THEME_OPTIONS: { value: ThemeMode; label: string; desc: string }[] = [
  { value: 'light', label: '浅色', desc: '明亮界面，默认推荐' },
  { value: 'dark', label: '深色', desc: '暗色背景，适合夜间' },
  { value: 'system', label: '跟随系统', desc: '自动匹配系统亮暗模式' },
]

export function GeneralPanel({
  config,
  onConfigChange,
}: Pick<SettingsPanelProps, 'config' | 'onConfigChange'>) {
  return (
    <section className="flex max-w-lg flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">通用</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          外观与启动选项
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">主题</p>
        <div className="flex flex-col gap-2">
          {THEME_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors',
                config.theme === opt.value
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-accent)]/30',
              )}
            >
              <input
                type="radio"
                name="theme"
                checked={config.theme === opt.value}
                onChange={() =>
                  onConfigChange((c) => ({ ...c, theme: opt.value }))
                }
                className="mt-0.5 accent-[var(--color-accent)]"
              />
              <span>
                <span className="font-medium">{opt.label}</span>
                <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
                  {opt.desc}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-sm">
        <input
          type="checkbox"
          checked={config.launchAtLogin}
          onChange={(e) =>
            onConfigChange((c) => ({ ...c, launchAtLogin: e.target.checked }))
          }
          className="size-4 accent-[var(--color-accent)]"
        />
        <span>
          <span className="font-medium">开机自启</span>
          <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
            登录时后台启动，不显示主窗口
          </span>
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-sm">
        <input
          type="checkbox"
          checked={config.opaqueOverlay}
          onChange={(e) =>
            onConfigChange((c) => ({ ...c, opaqueOverlay: e.target.checked }))
          }
          className="size-4 accent-[var(--color-accent)]"
        />
        <span>
          <span className="font-medium">不透明悬浮窗</span>
          <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
            关闭毛玻璃透明效果，需重启应用生效
          </span>
        </span>
      </label>
    </section>
  )
}
