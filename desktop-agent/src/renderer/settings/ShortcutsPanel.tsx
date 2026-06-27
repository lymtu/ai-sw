import { HotkeyRecorder } from './HotkeyRecorder'
import type { SettingsPanelProps } from './types'

export function ShortcutsPanel({
  config,
  onConfigChange,
}: Pick<SettingsPanelProps, 'config' | 'onConfigChange'>) {
  return (
    <section className="flex max-w-lg flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">快捷键</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          全局快捷键，保存后自动重新注册
        </p>
      </div>
      <HotkeyRecorder
        label="显示/隐藏输入框"
        value={config.hotkeyToggleOverlay}
        onChange={(hotkeyToggleOverlay) =>
          onConfigChange((c) => ({ ...c, hotkeyToggleOverlay }))
        }
      />
      <HotkeyRecorder
        label="说话"
        hint="显示悬浮窗并进入语音模式；再按一次结束识别，核对后发送"
        value={config.hotkeyPushToTalk}
        onChange={(hotkeyPushToTalk) =>
          onConfigChange((c) => ({ ...c, hotkeyPushToTalk }))
        }
      />
      <HotkeyRecorder
        label="切换文字 / 语音"
        hint="仅当输入框已显示时有效"
        value={config.hotkeyToggleInputMode}
        onChange={(hotkeyToggleInputMode) =>
          onConfigChange((c) => ({ ...c, hotkeyToggleInputMode }))
        }
      />
    </section>
  )
}
