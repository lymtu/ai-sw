import { useCallback, useEffect, useState } from 'react'
import {
  clearTransformersModelCache,
  deleteCachedWhisperModel,
  formatBytes,
  listCachedWhisperModels,
  type CachedWhisperModel,
} from '@renderer/shared/whisper-cache'
import { normalizeLocalWhisperModel } from '../../shared/whisper-local'
import { cn } from '@renderer/shared/cn'
import { IconTrash } from '@renderer/shared/icons/Icon'
import { deleteButtonClass } from './settings-form'

type Props = {
  activeModelId: string
}

export function WhisperCachePanel({ activeModelId }: Props) {
  const [models, setModels] = useState<CachedWhisperModel[]>([])
  const [totalBytes, setTotalBytes] = useState(0)
  const [entryCount, setEntryCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [clearingAll, setClearingAll] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const activeModel = normalizeLocalWhisperModel(activeModelId)

  const refresh = useCallback(async () => {
    setLoading(true)
    setStatus(null)
    try {
      const summary = await listCachedWhisperModels()
      setModels(summary.models)
      setTotalBytes(summary.totalBytes)
      setEntryCount(summary.entryCount)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '读取缓存失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const notifyOverlayCacheChange = async (deletedModelId?: string) => {
    await window.desktopAgent.notifyWhisperCacheChanged(deletedModelId)
  }

  const handleDeleteModel = async (modelId: string) => {
    setBusyId(modelId)
    setStatus(null)
    try {
      const removed = await deleteCachedWhisperModel(modelId)
      await notifyOverlayCacheChange(modelId)
      await refresh()
      setStatus(
        removed > 0
          ? `已删除 ${modelId}（${removed} 个文件）`
          : `未找到 ${modelId} 的缓存文件`,
      )
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '删除失败')
    } finally {
      setBusyId(null)
    }
  }

  const handleClearAll = async () => {
    setClearingAll(true)
    setStatus(null)
    try {
      await clearTransformersModelCache()
      await notifyOverlayCacheChange()
      await refresh()
      setStatus('已清空全部模型缓存')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '清空失败')
    } finally {
      setClearingAll(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">已下载模型</p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            浏览器缓存中的 Whisper 文件；删除后下次使用会重新下载
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || clearingAll}
          className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] disabled:opacity-50"
        >
          {loading ? '刷新中…' : '刷新'}
        </button>
      </div>

      <p className="text-xs text-[var(--color-muted)]">
        合计约 {formatBytes(totalBytes)}
        {entryCount > 0 ? ` · ${entryCount} 个缓存文件` : ''}
      </p>

      {loading && models.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">正在扫描缓存…</p>
      ) : null}

      {!loading && models.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          暂无已缓存模型。按住说话或预加载后会出现在这里。
        </p>
      ) : null}

      {models.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {models.map((m) => {
            const isActive = m.modelId === activeModel
            const busy = busyId === m.modelId
            return (
              <li
                key={m.modelId}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm',
                  isActive
                    ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/6'
                    : 'border-[var(--color-border)]',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{m.modelId}</span>
                    {isActive ? (
                      <span className="rounded bg-[var(--color-accent)]/15 px-1.5 py-0.5 text-xs text-[var(--color-accent)]">
                        当前使用
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    {formatBytes(m.sizeBytes)} · {m.fileCount} 个文件
                  </p>
                </div>
                <button
                  type="button"
                  title={`删除 ${m.modelId}`}
                  disabled={busy || clearingAll}
                  onClick={() => void handleDeleteModel(m.modelId)}
                  className={cn(deleteButtonClass, 'shrink-0 px-2.5')}
                >
                  <IconTrash className="size-4" />
                  <span className="sr-only">删除</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
        <button
          type="button"
          onClick={() => void handleClearAll()}
          disabled={loading || clearingAll || models.length === 0}
          className={cn(
            'rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs',
            'hover:border-red-400/50 hover:text-red-600 dark:hover:text-red-400',
            'disabled:opacity-50',
          )}
        >
          {clearingAll ? '清空中…' : '清空全部缓存'}
        </button>
      </div>

      {status ? (
        <p className="text-xs text-[var(--color-accent)]">{status}</p>
      ) : null}
    </div>
  )
}
