import { cn } from '@renderer/shared/cn'

type Props = {
  status: string | null
  loading: boolean
  visible: boolean
  onSave: () => void
}

export function SettingsSaveBar({ status, loading, visible, onSave }: Props) {
  return (
    <>
      {status ? (
        <p
          className={cn(
            'mt-5 max-w-2xl rounded-lg px-3 py-2 text-sm',
            status.includes('成功') || status.includes('已保存')
              ? 'status-success'
              : 'status-error',
          )}
        >
          {status}
        </p>
      ) : null}

      {visible ? (
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className={cn(
            'app-no-drag fixed bottom-6 right-6 z-50 rounded-full px-6 py-2.5 text-sm font-medium shadow-lg transition-transform',
            'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]',
            'disabled:opacity-50',
          )}
        >
          {loading ? '保存中…' : '保存'}
        </button>
      ) : null}
    </>
  )
}
