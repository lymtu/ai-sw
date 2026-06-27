import type { PublicProvider } from '../../shared/types'
import { cn } from '@renderer/shared/cn'
import { providerLabel } from '@renderer/shared/providers'

type Props = {
  providers: PublicProvider[]
  apiKeys: Record<string, string>
  editingId: string
  onSelect: (providerId: string) => void
  onAdd: () => void
}

export function ProviderTabs({
  providers,
  apiKeys,
  editingId,
  onSelect,
  onAdd,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => onSelect(provider.id)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm transition-colors',
            editingId === provider.id
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 font-medium text-[var(--color-accent)]'
              : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text)]',
          )}
        >
          {providerLabel(provider.name)}
          {provider.apiKeySet || apiKeys[provider.id]?.trim() ? (
            <span className="ml-1.5 text-[10px] opacity-70">已配 Key</span>
          ) : null}
        </button>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="rounded-full border border-dashed border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        + 添加供应商
      </button>
    </div>
  )
}
