import type { PublicConfig, PublicProvider } from '../../shared/types'
import { cn } from '@renderer/shared/cn'
import { createModel, providerLabel } from '@renderer/shared/providers'
import { IconTrash } from '@renderer/shared/icons/Icon'
import { deleteButtonClass, Field, inputClass } from './settings-form'
import { isSuccessMessage, updateProvider } from './provider-config'

type Props = {
  config: PublicConfig
  provider: PublicProvider
  apiKeys: Record<string, string>
  testStatus: string | null
  testing: boolean
  onApiKeyChange: (providerId: string, value: string) => void
  onConfigChange: (updater: (config: PublicConfig) => PublicConfig) => void
  onRemoveProvider: (providerId: string) => void
  onRemoveModel: (modelId: string) => void
  onTest: () => void
}

export function ProviderEditor({
  config,
  provider,
  apiKeys,
  testStatus,
  testing,
  onApiKeyChange,
  onConfigChange,
  onRemoveProvider,
  onRemoveModel,
  onTest,
}: Props) {
  return (
    <div className="@container rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">
          编辑：{providerLabel(provider.name)}
        </p>
        {config.providers.length > 1 ? (
          <button
            type="button"
            onClick={() => onRemoveProvider(provider.id)}
            className={deleteButtonClass}
          >
            <IconTrash className="size-3.5 shrink-0" />
            删除供应商
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <Field label="名称">
          <input
            className={inputClass}
            placeholder="供应商名称"
            value={provider.name}
            onChange={(e) =>
              onConfigChange((current) =>
                updateProvider(current, provider.id, (row) => ({
                  ...row,
                  name: e.target.value,
                })),
              )
            }
          />
        </Field>
        <Field label="Base URL" hint="OpenAI 兼容接口根路径，需包含 /v1">
          <input
            className={inputClass}
            placeholder="https://api.example.com/v1"
            value={provider.baseUrl}
            onChange={(e) =>
              onConfigChange((current) =>
                updateProvider(current, provider.id, (row) => ({
                  ...row,
                  baseUrl: e.target.value,
                })),
              )
            }
          />
        </Field>
        <Field
          label="API Key"
          hint={
            provider.apiKeySet ? '已保存，留空则不修改' : '保存后加密存储于本机'
          }
        >
          <input
            type="password"
            className={inputClass}
            placeholder={provider.apiKeySet ? '••••••••' : 'sk-...'}
            value={apiKeys[provider.id] ?? ''}
            onChange={(e) => onApiKeyChange(provider.id, e.target.value)}
            autoComplete="off"
          />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">模型列表</span>
            <button
              type="button"
              onClick={() =>
                onConfigChange((current) =>
                  updateProvider(current, provider.id, (row) => ({
                    ...row,
                    models: [...row.models, createModel()],
                  })),
                )
              }
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              + 添加模型
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {provider.models.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-muted)]">
                暂无模型，点击「添加模型」创建
              </p>
            ) : null}
            {provider.models.map((model) => (
              <div
                key={model.id}
                className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 @md:flex-row @md:items-stretch"
              >
                <input
                  className={cn(inputClass, 'min-w-0 w-full @md:flex-1')}
                  placeholder="显示名称"
                  value={model.name}
                  onChange={(e) =>
                    onConfigChange((current) =>
                      updateProvider(current, provider.id, (row) => ({
                        ...row,
                        models: row.models.map((item) =>
                          item.id === model.id
                            ? { ...item, name: e.target.value }
                            : item,
                        ),
                      })),
                    )
                  }
                />
                <input
                  className={cn(inputClass, 'min-w-0 w-full @md:flex-1')}
                  placeholder="API 模型 ID"
                  value={model.model}
                  onChange={(e) =>
                    onConfigChange((current) =>
                      updateProvider(current, provider.id, (row) => ({
                        ...row,
                        models: row.models.map((item) =>
                          item.id === model.id
                            ? { ...item, model: e.target.value }
                            : item,
                        ),
                      })),
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => onRemoveModel(model.id)}
                  className={cn(deleteButtonClass, 'w-full @md:w-auto @md:px-3')}
                  title="删除此模型"
                >
                  <IconTrash className="size-3.5 shrink-0" />
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onTest}
            disabled={testing}
            className="w-fit rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-surface)] disabled:opacity-50"
          >
            {testing ? '测试中…' : '测试连接'}
          </button>
          {testStatus ? (
            <p
              className={cn(
                'max-w-lg rounded-lg px-3 py-2 text-sm',
                isSuccessMessage(testStatus) ? 'status-success' : 'status-error',
              )}
            >
              {testStatus}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
