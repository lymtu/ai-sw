import type { PublicConfig } from '../../shared/types'
import { Dropdown } from '@renderer/shared/Dropdown'
import { modelLabel, providerLabel } from '@renderer/shared/providers'

type Props = {
  config: PublicConfig
  onConfigChange: (updater: (config: PublicConfig) => PublicConfig) => void
}

export function ActiveModelSelector({ config, onConfigChange }: Props) {
  const activeProvider =
    config.providers.find((provider) => provider.id === config.activeProviderId) ??
    config.providers[0]

  const activeModelInProvider = activeProvider?.models.some(
    (model) => model.id === config.activeModelId,
  )

  const resolvedActiveModelId = activeModelInProvider
    ? config.activeModelId
    : (activeProvider?.models[0]?.id ?? '')

  const setActive = (providerId: string, modelId: string) => {
    onConfigChange((current) => ({
      ...current,
      activeProviderId: providerId,
      activeModelId: modelId,
    }))
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
      <p className="text-sm font-medium">当前使用</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Dropdown
          label="供应商"
          value={config.activeProviderId}
          options={config.providers.map((provider) => ({
            value: provider.id,
            label: providerLabel(provider.name),
          }))}
          onChange={(providerId) => {
            const provider = config.providers.find((p) => p.id === providerId)
            if (provider) {
              setActive(provider.id, provider.models[0]?.id ?? '')
            }
          }}
        />
        <Dropdown
          label="模型"
          value={resolvedActiveModelId}
          disabled={!activeProvider?.models.length}
          placeholder="暂无模型，请在下方添加"
          options={
            activeProvider?.models.map((model) => ({
              value: model.id,
              label: modelLabel(model.name, model.model),
              description:
                model.name.trim() &&
                model.model.trim() &&
                model.name.trim() !== model.model.trim()
                  ? model.model.trim()
                  : undefined,
            })) ?? []
          }
          onChange={(modelId) => {
            setActive(config.activeProviderId, modelId)
          }}
        />
      </div>
    </div>
  )
}
