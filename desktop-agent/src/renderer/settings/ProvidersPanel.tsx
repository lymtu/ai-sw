import { useEffect, useState } from 'react'
import type { PublicConfig } from '../../shared/types'
import { createProvider } from '@renderer/shared/providers'
import { ActiveModelSelector } from './ActiveModelSelector'
import { ProviderEditor } from './ProviderEditor'
import { ProviderTabs } from './ProviderTabs'
import { updateProvider } from './provider-config'
import type { SettingsPanelProps } from './types'
import { useProviderConnectionTest } from './useProviderConnectionTest'

type Props = SettingsPanelProps

export function ProvidersPanel({
  config,
  apiKeys,
  onApiKeyChange,
  onConfigChange,
}: Props) {
  const [editingId, setEditingId] = useState(config.activeProviderId)

  const editing =
    config.providers.find((provider) => provider.id === editingId) ??
    config.providers[0]

  const {
    testStatus,
    testing,
    clearTestStatus,
    handleTest,
  } = useProviderConnectionTest(editing, apiKeys)

  useEffect(() => {
    if (!config.providers.some((provider) => provider.id === editingId)) {
      setEditingId(config.providers[0]?.id ?? '')
    }
  }, [config.providers, editingId])

  const addProvider = () => {
    const provider = createProvider()
    onConfigChange((current) => ({
      ...current,
      providers: [...current.providers, { ...provider, apiKeySet: false }],
    }))
    setEditingId(provider.id)
    clearTestStatus()
  }

  const removeProvider = (providerId: string) => {
    if (config.providers.length <= 1) return

    const idx = config.providers.findIndex((provider) => provider.id === providerId)
    const focusId =
      idx > 0
        ? config.providers[idx - 1]!.id
        : config.providers[idx + 1]!.id

    onConfigChange((current) => {
      const providers = current.providers.filter(
        (provider) => provider.id !== providerId,
      )
      let { activeProviderId, activeModelId } = current

      if (current.activeProviderId === providerId) {
        const fallback =
          providers.find((provider) => provider.id === focusId) ?? providers[0]!
        activeProviderId = fallback.id
        activeModelId = fallback.models[0]?.id ?? ''
      }

      return { ...current, providers, activeProviderId, activeModelId }
    })

    if (editingId === providerId) {
      setEditingId(focusId)
    }
    clearTestStatus()
  }

  const removeModel = (modelId: string) => {
    if (!editing) return

    onConfigChange((current: PublicConfig) => {
      const provider = current.providers.find((row) => row.id === editing.id)
      if (!provider) return current

      const models = provider.models.filter((row) => row.id !== modelId)
      let activeModelId = current.activeModelId

      if (
        current.activeProviderId === editing.id &&
        current.activeModelId === modelId
      ) {
        activeModelId = models[0]?.id ?? ''
      }

      return {
        ...updateProvider(current, editing.id, (row) => ({ ...row, models })),
        activeModelId,
      }
    })
  }

  if (!editing) {
    return (
      <section className="text-sm text-[var(--color-muted)]">暂无供应商</section>
    )
  }

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold">供应商与模型</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          配置多个 OpenAI 兼容供应商，并选择当前对话使用的模型
        </p>
      </div>

      <ActiveModelSelector config={config} onConfigChange={onConfigChange} />

      <ProviderTabs
        providers={config.providers}
        apiKeys={apiKeys}
        editingId={editingId}
        onSelect={(providerId) => {
          setEditingId(providerId)
          clearTestStatus()
        }}
        onAdd={addProvider}
      />

      <ProviderEditor
        config={config}
        provider={editing}
        apiKeys={apiKeys}
        testStatus={testStatus}
        testing={testing}
        onApiKeyChange={onApiKeyChange}
        onConfigChange={onConfigChange}
        onRemoveProvider={removeProvider}
        onRemoveModel={removeModel}
        onTest={() => void handleTest()}
      />
    </section>
  )
}
