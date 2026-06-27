import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatSession, ChatSessionSummary } from '../../shared/chat-history'
import { IconTrash } from '@renderer/shared/icons/Icon'
import { cn } from '@renderer/shared/cn'
import { deleteButtonClass } from './settings-form'

function formatSessionTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SessionDetailsItem({
  summary,
  busy,
  isOpen,
  onToggle,
  onDelete,
}: {
  summary: ChatSessionSummary
  busy: boolean
  isOpen: boolean
  onToggle: (open: boolean) => void
  onDelete: (id: string) => void
}) {
  const [session, setSession] = useState<ChatSession | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const loadedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    if (loadedIdRef.current === summary.id && session) return
    let cancelled = false
    setLoadingDetail(true)
    void window.desktopAgent.getChatSession(summary.id).then((data) => {
      if (!cancelled) {
        setSession(data)
        loadedIdRef.current = data?.id ?? null
        setLoadingDetail(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [isOpen, summary.id])

  return (
    <details
      className="history-details group"
      open={isOpen}
      onToggle={(e) => onToggle(e.currentTarget.open)}
    >
      <summary className="history-details__summary">
        <span
          className={cn('history-details__chevron', isOpen && 'is-open')}
          aria-hidden
        />
        <span className="history-details__body">
          <span className="history-details__head">
            <span className="history-details__title">{summary.title}</span>
            <span className="history-details__meta">
              <time dateTime={new Date(summary.updatedAt).toISOString()}>
                {formatSessionTime(summary.updatedAt)}
              </time>
              <span className="history-details__dot" aria-hidden>
                ·
              </span>
              <span>{summary.messageCount} 条</span>
            </span>
          </span>
          {!isOpen && summary.preview ? (
            <span className="history-details__preview">{summary.preview}</span>
          ) : null}
        </span>
        <button
          type="button"
          disabled={busy}
          title="删除此会话"
          aria-label="删除此会话"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete(summary.id)
          }}
          className={cn(deleteButtonClass, 'history-details__delete')}
        >
          <IconTrash />
        </button>
      </summary>

      <div className="history-details__content">
        {loadingDetail ? (
          <p className="text-sm text-[var(--color-muted)]">加载中…</p>
        ) : session ? (
          <div className="history-details__messages space-y-2.5">
            {session.messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'history-details__bubble',
                  m.role === 'user'
                    ? 'history-details__bubble--user'
                    : 'history-details__bubble--assistant',
                )}
              >
                <span className="history-details__role">
                  {m.role === 'user' ? '我' : '助手'}
                </span>
                <p className="history-details__text">{m.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">无法加载会话</p>
        )}
      </div>
    </details>
  )
}

export function HistoryPanel() {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const list = await window.desktopAgent.listChatSessions()
      setSessions(list)
      return list
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '加载失败')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (openId && !sessions.some((s) => s.id === openId)) {
      setOpenId(null)
    }
  }, [sessions, openId])

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除这条会话？')) return
    setBusy(true)
    setMessage(null)
    try {
      await window.desktopAgent.deleteChatSession(id)
      const list = await loadList()
      if (openId === id) {
        setOpenId(null)
      }
      if (!list.length) setOpenId(null)
      setMessage('已删除')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '删除失败')
    } finally {
      setBusy(false)
    }
  }

  const handleClearAll = async () => {
    if (!sessions.length) return
    if (!window.confirm('确定清空全部会话历史？此操作不可恢复。')) return
    setBusy(true)
    setMessage(null)
    try {
      await window.desktopAgent.clearChatSessions()
      setOpenId(null)
      await loadList()
      setMessage('已清空')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '清空失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">会话历史</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            点击条目展开完整对话；仅保存在本机。
          </p>
        </div>
        <button
          type="button"
          disabled={busy || sessions.length === 0}
          onClick={() => void handleClearAll()}
          className={cn(
            'shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs',
            'text-[var(--color-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          清空全部
        </button>
      </div>

      {message ? (
        <p
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            message.includes('失败')
              ? 'status-error'
              : 'bg-[var(--color-surface-elevated)] text-[var(--color-muted)]',
          )}
        >
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">加载中…</p>
      ) : sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted)]">
          暂无会话记录。在输入框发送消息后会自动保存。
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <SessionDetailsItem
              key={s.id}
              summary={s}
              busy={busy}
              isOpen={openId === s.id}
              onToggle={(open) => setOpenId(open ? s.id : null)}
              onDelete={(id) => void handleDelete(id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
