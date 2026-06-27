import type { PublicConfig } from '../../shared/types'
import { cn } from '@renderer/shared/cn'
import { Field, inputClass } from './settings-form'

type Props = {
  config: PublicConfig
  onConfigChange: (updater: (c: PublicConfig) => PublicConfig) => void
}

export function PromptPanel({ config, onConfigChange }: Props) {
  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">系统提示词</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          定义 AI 助手的默认角色、语气与回复规则，每次对话都会附带发送
        </p>
      </div>

      <Field
        label="提示词内容"
        hint="留空则仅使用模型默认行为；建议用简洁的中文或英文说明"
      >
        <textarea
          className={cn(inputClass, 'min-h-[320px] resize-none leading-relaxed')}
          value={config.systemPrompt}
          placeholder="例如：你是简洁专业的桌面助手，用用户使用的语言回复，优先给出可执行步骤。"
          onChange={(e) =>
            onConfigChange((c) => ({ ...c, systemPrompt: e.target.value }))
          }
        />
      </Field>
    </section>
  )
}
