export function AboutPanel() {
  return (
    <section className="flex max-w-lg flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">关于</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">桌面 AI 助手</p>
      </div>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 text-sm leading-relaxed text-[var(--color-muted)]">
        <p className="font-medium text-[var(--color-text)]">Desktop Agent</p>
        <p className="mt-2">
          托盘常驻 · 多供应商多模型 · 全局快捷键与语音输入
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1">
          <li>左键托盘图标打开设置</li>
          <li>右键托盘可显示输入框或退出</li>
          <li>默认启动时显示输入组件</li>
        </ul>
      </div>
    </section>
  )
}
